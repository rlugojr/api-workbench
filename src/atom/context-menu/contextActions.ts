/// <reference path="../../../typings/main.d.ts" />

import _ = require("underscore")

export var TARGET_RAML_EDITOR_NODE = "TARGET_RAML_EDITOR_NODE"

export var TARGET_RAML_TREE_VIEWER_NODE = "TARGET_RAML_TREE_VIEWER_NODE"

/**
 * Calculates and returns context state, which will be then used
 * for action visibility filtering and later passed to the action onClick callback.
 */
export interface IContextStateCalculator {

    /**
     * Is called to calculate context
     */
    calculate () : any

    /**
     * If present is called before any context calculations are started
     */
    contextCalculationStarted? : () => void;

    /**
     * If present is called after all context calculations are finished
     */
    contextCalculationFinished? : () => void;
}

/**
 * Is called when user activates action. Recieves context state previously calculated by
 * the context state calculator
 */
export interface IActionItemCallback {
    (contextState? : any) : void
}

/**
 * Is called to determine whether the current action should be displayed.
 */
export interface IActionVisibilityFilter {
    (contextState? : any) : boolean
}

export interface IContextDependedAction {

    /**
     * Displayed menu item name
     */
    name : string

    /**
     * Action target (like editor node, tree viewer etc).
     * The value must be recognizable by action consumers.
     * Some of the standard values are defined in this module.
     */
    target : string

    /**
     * Action category and potential subcategories.
     * In example, item with a name "itemName" and categories ["cat1", "cat2"]
     * will be displayed as the following menu hierarchy: cat1/cat2/itemName
     */
    category? : string[]

    /**
     * Callback called when the action is activated, recieves context state if state calculator
     * is present and returned one
     */
    onClick : IActionItemCallback

    /**
     * Optional label, will be used instead of name for display purpose
     */
    label? : string

    /**
     * Context state calculator, is called before the item is displayed,
     * its results are then passed to shouldDisplay and onClick
     */
    stateCalculator? : IContextStateCalculator

    /**
     * If present is called to determine whether the item should be displayed.
     * Context state is passed as a parameter if
     */
    shouldDisplay? : IActionVisibilityFilter
}

export interface IExecutableAction {

    /**
     * Displayed menu item name
     */
    name : string

    /**
     * Action target (like editor node, tree viewer etc).
     * The value must be recognizable by action consumers.
     * Some of the standard values are defined in this module.
     */
    target : string

    /**
     * Action category and potential subcategories.
     * In example, item with a name "itemName" and categories ["cat1", "cat2"]
     * will be displayed as the following menu hierarchy: cat1/cat2/itemName
     */
    category? : string[]

    /**
     * Callback called when the action is activated.
     */
    onClick : ()=>void

    /**
     * Optional label, will be used instead of name for display purpose
     */
    label? : string
}

/**
 * Registers an action, which will take part in all engine consumers, like
 * context menu, outline actions and potentially toolbar
 * @param action
 */
export function addAction(action : IContextDependedAction) {
    if (_.find(actions, currentAction => {
            return currentAction.name == action.name
    })) {
        return
    }

    actions.push(action)
}

/**
 * Shortcut for adding simple actions. Not recommended, use addAction() instead to
 * provide state calculator.
 *
 * See IContextDependedAction fields for parameter descriptions.
 * @param name
 * @param target
 * @param onClick
 * @param shouldDisplay
 * @param category
 */
export function addSimpleAction(name : string, category : string[], target : string, onClick : IActionItemCallback,
                                shouldDisplay? : IActionVisibilityFilter)  {
    var newAction : IContextDependedAction = {
        name : name,
        target: target,
        onClick : onClick,
        shouldDisplay : shouldDisplay,
        category : category
    }

    addAction(newAction)
}

class ExecutableAction implements IExecutableAction {

    name : string

    category : string[]

    label : string

    target : string

    state : any

    originalAction : IContextDependedAction

    onClick : ()=>void


    constructor(targetAction : IContextDependedAction, state : any) {
        this.name = targetAction.name

        this.category = targetAction.category

        this.label = targetAction.label

        this.target = targetAction.target

        this.state = state

        this.originalAction = targetAction

        this.onClick = ()=> {

            this.originalAction.onClick(this.state)
        }
    }
}

/**
 * Used by consumers to determine the actions to execute
 */
export function calculateCurrentActions(target : string) : IExecutableAction[] {

    var result : IExecutableAction[] = []

    try {
        var filteredActions = actions.filter(action => {
            return action.target == target
        })

        filteredActions.forEach(action => {
            if (action.stateCalculator) {
                if (action.stateCalculator.contextCalculationStarted) {
                    try {
                        action.stateCalculator.contextCalculationStarted()
                    } catch (Error){console.error(Error.message)}
                }
            }
        })

        filteredActions.forEach(action => {
            try {
                var state:any = null;
                if (action.stateCalculator) {
                    state = action.stateCalculator.calculate();
                }

                if (action.shouldDisplay) {
                   if (!action.shouldDisplay(state)) {
                       return
                   }
                }

                result.push(new ExecutableAction(action, state))
            } catch (Error){console.error(Error.message)}
        })

        filteredActions.forEach(action => {
            if (action.stateCalculator) {
                if (action.stateCalculator.contextCalculationFinished) {
                    try {
                        action.stateCalculator.contextCalculationFinished()
                    } catch (Error){console.error(Error.message)}
                }
            }
        })
    } catch (Error){console.error(Error.message)}

    return result
}

export function getCategorizedActionLabel(action : IExecutableAction) : string {
    if (action.label) {
        return action.label
    }

    var result : string = "api-workbench:"

    if (action.category) {
        action.category.forEach(cat => {
            result = result + cat + ": "
        })
    }

    result = result + action.name

    return result
}

/**
 * Must be called once on module startup
 */
//export function initialize() {
//    if (initialized) {
//        return;
//    }
//
//    initialized = true;
//}


var initialized = false;
var actions : IContextDependedAction[] = []
