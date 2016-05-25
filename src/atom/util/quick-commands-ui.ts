/// <reference path="../../../typings/main.d.ts" />

import atom = require('../raml1/atomWrapper');
import aspv = require('atom-space-pen-views');


/*
 * List viewer for commands. accepts confirmation function, label function and key for fuzzy filtering.
 */
export class SelectListView<T> extends aspv.SelectListView {
 
  constructor(public _confirmed: (item: T) => void, private label: (item: T)=>any, private filterKey: string = '') {
    super([]);
  }
  
  getFilterKey() { return this.filterKey; }

  viewForItem(item) {
    return "<li>" + this.label(item) + "</li>";
  }

  cancel() {
    this.panel.hide();
    super.cancel();
  }

  hide() {
    if (!this.panel) return;
    this.panel.hide();
  }
  
  confirmed(item) {
    this._confirmed(item);
    this.hide();
    return this.getSelectedItemView(); 
  }

  private panel: any;

  show(commands: T[]) {
    this.storeFocusedElement();
    if (!this.panel) this.panel = atom.workspace.addModalPanel({ item: <any>this });
    this.setItems(commands);
    this.panel.show();
    this.focusFilterEditor();
  }
}
