'use strict';

/// <reference path="../../typing/ControlFramework.d.ts"/>

module CC {

	declare var window: any;

	let Xrm: any;
	Xrm = window["Xrm"];


	declare var jQuery: any;
	declare var _: any;

	class Common {

		private static _instance: Common;

		private constructor() {
		}

		public static get Instance() {
			// Do you need arguments? Make it a regular method instead.
			return this._instance || (this._instance = new this());
		}

		loadScript(url: string, callback: Function) {

			var script: any = document.createElement("script");
			script.type = "text/javascript";

			if (script.readyState) { //IE
				script.onreadystatechange = function () {
					if (script.readyState == "loaded" || script.readyState == "complete") {
						script.onreadystatechange = null;
						callback();
					}
				};
			} else { //Others
				script.onload = function () {
					callback();
				};
			}

			script.src = url;
			document.getElementsByTagName("head")[0].appendChild(script);
		}

		ensureJQuery(cb: Function) {
			if (jQuery) {
				console.log('jquery was loaded');
			}
			else {
				console.log('jquery is not loaded.  Loading jquery');
				this.loadScript("https://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js", function () {
					//jQuery loaded
					console.log('jquery loaded');
				});
			}
		}

		log(obj: any) {
			console.log('***************************');
			console.log(obj);
		}

		getLink = function (id: string, entityTypeName: string, context: any) {
			var url = context.page.getClientUrl();
			url = url + "/main.aspx?appid=" + context.page.appId + "&pagetype=entityrecord&etn=" + entityTypeName + "&id=" + id;
			return url;
		};
	}

	declare module InputsOutputs {
		interface IInputs {
			// Bound property and Input property on manifest
			LifeStage: ControlFramework.PropertyTypes.OptionSetProperty;
		}

		interface IOutputs {
			// Bound property and Output property on manifest
			LifeStage?: string;
		}
	}

	export class HierarchyControl implements ControlFramework.StandardControl<InputsOutputs.IInputs, InputsOutputs.IOutputs> {
		Container: HTMLDivElement;
		Context: ControlFramework.Context<InputsOutputs.IInputs>;
		NotifyOutputChanged: () => void;

		EntityId: string;
		HierarchyElements: Array<HierarchyElement>;

		static entityType = {
			entityName: "account",
			fields: {
				id: "accountid",
				name: "name",
				parentIdResponce: "_parentaccountid_value"
			}
		};

		constructor() {
			this.HierarchyElements = [];
		}

		/**
		 * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
		 * Data-set values are not initialized here, use updateView.
		 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
		 * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
		 * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
		 * @param container If a control is marked control-type='starndard', it will receive an empty div element within which it can render its content.
		 */
		public init(context: ControlFramework.Context<InputsOutputs.IInputs>, notifyOutputChanged: () => void, state: ControlFramework.Dictionary, container: HTMLDivElement): void {
			Common.Instance.log('Hierarchy init');
			this.Context = context;
			this.NotifyOutputChanged = notifyOutputChanged;
			this.Container = container;

			//this.EntityTypeName = (<any>this.Context).page.entityTypeName;
			this.EntityId = (<any>this.Context).page.entityId;

			this.loadDataArr([this.EntityId])
				.then(() => {
					this.render();
				});
		}

		/**
		 * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
		 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
		 */
		public updateView(context: ControlFramework.Context<InputsOutputs.IInputs>): void {
			Common.Instance.log('Hierarchy updateView');
		}

		/** 
		 * It is called by the framework prior to a control receiving new data. 
		 * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
		 */
		public getOutputs(): InputsOutputs.IOutputs {
			return null;
		}

		/** 
 		 * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
		 * i.e. cancelling any pending remote calls, removing listeners, etc.
		 */
		public destroy(): void {
			//
		}

		loadDataArr(entityIds: string[]): Promise<any> {
			if (entityIds.length == 0) {
				return;
			}

			var here: HierarchyControl = this;

			var f = (index: number): Promise<any> => {

				return here.loadData(entityIds[index])
					.then(
						() => {
							if (index + 1 < entityIds.length) {
								return f(++index);
							}
							else {
								return;
							}
						}
					);
			};

			return f(0);
		}

		loadData(entityId: string): Promise<any> {
			if (entityId == undefined || this.processed(entityId)) {
				return null;
			}

			var here: HierarchyControl = this;

			//get details
			//check parent
			//check child

			var hierarchyElement: HierarchyElement;
			return this.Context.webAPI.retrieveRecord(HierarchyControl.entityType.entityName, entityId)
				.then(
					(result: any) => {
						hierarchyElement = HierarchyControl.parseJSONResponse(result);
						here.HierarchyElements.push(hierarchyElement);

						if (hierarchyElement.ParentEntityId && !here.processed(hierarchyElement.ParentEntityId)) {
							return here.loadData(hierarchyElement.ParentEntityId);
						}
					}
				)
				.then(() => {
					let query = "?$select=" + HierarchyControl.entityType.fields.id
						+ "&$filter=" + HierarchyControl.entityType.fields.parentIdResponce + " eq " + hierarchyElement.EntityId;
					return here.Context.webAPI.retrieveMultipleRecords(HierarchyControl.entityType.entityName, query);
				})
				.then(
					(result: any) => {
						let ids = [];
						for (let i = 0; i < result.entities.length; i++) {
							let ent = result.entities[i];

							let id: string = ent[HierarchyControl.entityType.fields.id];

							if (here.processed(id)) {
								continue;
							}

							ids.push(id);
						}
						if (ids.length > 0) {
							return here.loadDataArr(ids);
						}
					});
		}

		static parseJSONResponse(obj: any): HierarchyElement {
			let hierarchyElement: HierarchyElement = new HierarchyElement();
			hierarchyElement.EntityId = obj[HierarchyControl.entityType.fields.id];
			hierarchyElement.Name = obj[HierarchyControl.entityType.fields.name];
			hierarchyElement.ParentEntityId = obj[HierarchyControl.entityType.fields.parentIdResponce];

			return hierarchyElement;
		}

		processed(id: string): boolean {
			for (let index = 0; index < this.HierarchyElements.length; index++) {
				let element: HierarchyElement = this.HierarchyElements[index];
				if (element.EntityId == id) {
					return true;
				}
			}
			return false;
		}


		render() {
			this.HierarchyElements.sort(
				(he1: HierarchyElement, he2: HierarchyElement) => {
					return ('' + he1.Name).localeCompare(he2.Name);
				});
			this.renderElement(0, null, this.Container);
		}

		renderElement(level: number, parentId: string, container: HTMLElement) {

			var childNodes: Array<HierarchyElement> = this.HierarchyElements.filter((o: HierarchyElement) => {
				return o.ParentEntityId == parentId;
			});

			if (childNodes.length == 0) {
				return;
			}

			var ulDiv = <HTMLDivElement>(document.createElement('div'));
			container.appendChild(ulDiv);
			ulDiv.classList.add("HierarchyElementDiv");
			ulDiv.classList.add("HierarchyElementDiv_" + level);

			var ul = <HTMLUListElement>(document.createElement('ul'));
			ulDiv.appendChild(ul);
			ul.classList.add("HierarchyElementUL");
			ul.classList.add("HierarchyElementUL_" + level);

			for (let index = 0; index < childNodes.length; index++) {
				let he: HierarchyElement = childNodes[index];

				var li = <HTMLLIElement>(document.createElement('li'));
				ul.appendChild(li);
				li.classList.add("HierarchyElementLI");
				li.classList.add("HierarchyElementLI_" + level);

				let liDiv = <HTMLDivElement>(document.createElement('div'));
				li.appendChild(liDiv);
				liDiv.classList.add("HierarchyElementDivLink");
				if (he.EntityId == this.EntityId) {
					liDiv.classList.add("Current");
				}

				if (level != 0) {
					liDiv.innerHTML = '<div class="HierarchyElementDivLine"><div class="HierarchyElementDivLine2nd"><div class="HierarchyElementDivLine3rd"></div></div></div>';
				}

				let liDivLink = <HTMLAnchorElement>(document.createElement('a'));
				liDiv.appendChild(liDivLink);
				liDivLink.href = Common.Instance.getLink(he.EntityId, HierarchyControl.entityType.entityName, this.Context);
				liDivLink.innerText = he.Name;

				// let liDivSpan = <HTMLAnchorElement>(document.createElement('span'));
				// liDiv.appendChild(liDivSpan);
				// liDivSpan.innerText = ''; //additional 

				this.renderElement((level + 1), he.EntityId, li);
			}
		}
	}

	class HierarchyElement {
		ParentEntityId: string;
		EntityId: string;
		Name: string;

		//GroupId: string;
		//ContactId: string;
		//Role: string;
	}
}