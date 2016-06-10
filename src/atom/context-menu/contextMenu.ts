/// <reference path="../../../typings/main.d.ts" />

import _ = require("underscore")
import commandManager = require("../quick-commands/command-manager")


/**
 * Single context menu item.
 */
export interface IContextMenuItem {
    /**
     * CSS Selector, determining, to which html node item is applicable to.
     */
    selector : string

    /**
     * Displayable context menu item label
     */
    name : string

    /**
     * Optional item categories. In example, item with a name "itemName" and categories ["cat1", "cat2"]
     * will be displayed as the following menu hierarchy: cat1/cat2/itemName
     */
    categories? : string[]

    /**
     * Callback called when the item is clicked.
     * @param item - item that was clicked
     */
    onClick: (item? : IContextMenuItem)=>void
}

/**
 * Contributes context menu items.
 * Is called before each menu display.
 */
export interface IContextMenuContributor {

    /**
     * Unique contributor id.
     */
    id : string

    /**
     * Calculates items to display in the context menu.
     * This is runtime method, called each time for each contributor before
     * the menu is displayed.
     */
    calculateItems () : IContextMenuItem[]

    /**
     * Optionally notifies contributor that the menu is about to be displayed and
     * item calculations are started
     */
    calculationStarted? : ()=>void

    /**
     * Optionally notifies contributor that the menu is about to be displayed and
     * item calculations are done
     */
    calculationFinished? : ()=>void
}

var originalShowForEvent : (object : any, args : any)=>void

/**
 * Must be called first, at startup, before the module is used.
 */
export function initialize() {
    if (initialized) {
        return;
    }

    initialized = true;


    originalShowForEvent = atom.contextMenu.constructor.prototype.showForEvent


    atom.contextMenu.constructor.prototype.showForEvent = (event : any) => {
        preMenuDisplay()

        originalShowForEvent.apply(atom.contextMenu, [event]);

        postMenuDisplay()
    }
}

/**
 * Adds new contributor to the list. All contributors are asked for the menu items
 * before the menu is displayed.
 * @param contributor
 */
export function registerContributor(contributor : IContextMenuContributor) {
    contributors[contributor.id] = contributor;
}

/**
 * Generally it is recommended to use contributor-based architecture instead.
 * This method allows adding a single menu item manually, if needed.
 * @param name
 * @param onClick
 * @param categories
 * @param shouldDisplay
 */
export function addMenuItem(name : string, onClick: (item? : IContextMenuItem)=>void,
    categories? : string[], shouldDisplay? : ()=>boolean) {

}

/**
 * Generally it is recommended to use contributor-based architecture instead.
 * Deletes all menu items with a given selector. Should almost never be called.
 * Can not delete contributor-based menu items.
 * @param selector
 */
export function deleteMenuItems(selector : string) {
    //TODO implement
}

/**
 * Generally it is recommended to use contributor-based architecture instead.
 * Deletes menu item by its selector, name, and optionally categories.
 * Can not delete contributor-based menu items.
 * @param selector
 * @param name
 * @param categories
 */
export function deleteMenuItem(selector : string, name : string, categories? : string[]) {
    //TODO implement
}

var contributors: { [s: string]: IContextMenuContributor; } = {};

var initialized = false;

class ContextMenuItemNode implements IContextMenuItem {

    selector : string

    name : string

    categories : string[]

    onClick: (item? : IContextMenuItem)=>void

    children : ContextMenuItemNode[]

    constructor(menuItem : IContextMenuItem, nameOverride? : string) {
        this.selector = menuItem.selector

        if (nameOverride){
            this.name = nameOverride
        } else {
            this.name = menuItem.name
        }

        this.categories = menuItem.categories
        this.onClick = menuItem.onClick

        this.children = []
    }
}

/**
 * Selector that were used at least once in the context menu
 * @type {Array}
 */
var usedSelectors : string[] = []

function preMenuDisplay() {
    try {
        var treeRoots:ContextMenuItemNode[] = calculateMenuItemsTree();

        var nodeSets:{[s:string] : AtomCore.IContextMenuItemSet} = {}

        cleanExistingSets();
        commandManager.deleteCommandsByTag(commandManager.DYNAMIC_COMMAND_TAG)

        treeRoots.forEach(node => {
            var itemSet = nodeSets[node.selector]

            if (!itemSet) {
                itemSet = findOrCreateItemSet(node.selector);
                nodeSets[node.selector] = itemSet;
            }

            var menuItem = constructAtomMenuItem(node)

            itemSet.items.push(menuItem)
        })
    } catch (Error) {
        console.log(Error.message)
    }
}

function constructAtomMenuItem(node : ContextMenuItemNode) : AtomCore.IContextMenuItem {
    var result : AtomCore.IContextMenuItem = {
        label : node.name,
    }

    if (node.children.length > 0) {
        result.submenu = []
    } else {
        var commandName = "api-workbench:"+node.name
        var existingCommands = commandManager.listCommands()
        commandManager.addCommand(node.selector, commandName, node.onClick,
            commandManager.DYNAMIC_COMMAND_TAG)
        result.command = commandName
    }

    node.children.forEach(child => {
        var childMenuItem = constructAtomMenuItem(child)
        result.submenu.push(childMenuItem)
    })

    return result;
}

interface ITaggedItemSet extends AtomCore.IContextMenuItemSet {
    tag? : string
}

var DYNAMIC_SET_TAG = "DYNAMIC_SET_TAG"

function findOrCreateItemSet(selector : string) : AtomCore.IContextMenuItemSet{
    var existingSet =  _.find(atom.contextMenu.itemSets, currentSet=>{

      return (<ITaggedItemSet>currentSet).tag && (<ITaggedItemSet>currentSet).tag == DYNAMIC_SET_TAG;
    })

    if (!existingSet) {
        existingSet = <any>{
            items : [],
            selector : selector,
            specificity : 11,
            tag: DYNAMIC_SET_TAG
        }

        atom.contextMenu.itemSets.push(existingSet)

        //saving used selector name
        if(!_.find(usedSelectors, name=>{return name == selector})){
            usedSelectors.push(selector)
        }
    }

    return existingSet
}

function cleanExistingSets() {
    var existingSets =  _.filter(atom.contextMenu.itemSets, currentSet=>{

        return (<ITaggedItemSet>currentSet).tag && (<ITaggedItemSet>currentSet).tag == DYNAMIC_SET_TAG;
    })

    existingSets.forEach(existingSet=>{
        existingSet.items = []
    })
}

function postMenuDisplay() {
    //commandManager.deleteCommandsByTag(commandManager.DYNAMIC_COMMAND_TAG)
}

function calculateMenuItemsTree() : ContextMenuItemNode[] {
    var result : ContextMenuItemNode[] = [];

    for (var contributorId in contributors) {

        var contributor = contributors[contributorId];
        if (contributor.calculationStarted) {
            contributor.calculationStarted();
        }
    }

    for (var contributorId in contributors) {

        var contributor : IContextMenuContributor = contributors[contributorId];
        contributor.calculateItems().forEach(item => {
            addItemsTreeNode(result, item)
        });
    }

    for (var contributorId in contributors) {

        var contributor = contributors[contributorId];
        if (contributor.calculationFinished) {
            contributor.calculationFinished();
        }
    }

    return result;
}

function addItemsTreeNode(roots : ContextMenuItemNode[], item : IContextMenuItem) {

    var currentList = roots;
    if (item.categories) {
        for (var catIndex in item.categories) {
            var currentSegment = item.categories[catIndex]
            var existingNode = _.find(currentList, node => {
                return node.name == currentSegment
            })

            if (!existingNode) {
                existingNode = new ContextMenuItemNode(item, currentSegment);
                currentList.push(existingNode)
            }

            if (!existingNode.children) {
                currentList = [];
                existingNode.children = currentList
            } else {
                currentList = existingNode.children
            }
        }
    }

    var leafNode = _.find(currentList, node => {
        return node.name == item.name
    })

    if (leafNode) {
        var index = currentList.indexOf(leafNode, 0);
        if (index != undefined) {
            currentList.splice(index, 1);
        }
    }

    leafNode = new ContextMenuItemNode(item)

    currentList.push(leafNode)

    //var existingRoot = _.find(roots, currentItem => {
    //    return item.name == currentItem.name
    //})
    //
    //if (!existingRoot) {
    //    existingRoot = new ContextMenuItemNode(item);
    //    roots.push(existingRoot)
    //}
    //
    //if (!item.categories) {
    //
    //    return
    //}
    //
    //var currentParent = existingRoot;
    //
    //item.categories.forEach(category=>{
    //
    //    var existingNode = _.find(currentParent.children, currentItem => {
    //        return category == currentItem.name
    //    })
    //
    //    if (!existingNode) {
    //        existingNode = new ContextMenuItemNode(item)
    //        currentParent.children.push(existingNode)
    //        return
    //    }
    //
    //    currentParent = existingNode
    //})
}
