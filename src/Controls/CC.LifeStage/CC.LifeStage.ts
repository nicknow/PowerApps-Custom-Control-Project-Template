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

		wait(ms: number) {
			var start = new Date().getTime();
			var end = start;
			while (end < start + ms) {
				end = new Date().getTime();
			}
		}
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


	export class LifeStage implements ControlFramework.StandardControl<InputsOutputs.IInputs, InputsOutputs.IOutputs> {
		D365EntityName: string;
		D365PropertyName: string;

		Container: HTMLDivElement;
		Context: ControlFramework.Context<InputsOutputs.IInputs>;
		NotifyOutputChanged: () => void;

		LifeStageStrOriginal: string;
		LifeStageStr: string;

		Table: HTMLTableElement;
		TD2: HTMLTableDataCellElement;
		LILifeStages: HTMLLIElement[];
		SaveButton: HTMLElement;

		static LifeStages = [
			{
				name: "Family and Career Building Years",
				val: "100000001",
				mention: [
					"Small Business Banking", "Debt Consolidation", "Home & Life Insurance Products"
				]
			},
			{
				name: "Planning for Retirement",
				val: "100000002",
				mention: [
					"Small Business Banking", "Debt Consolidation"
				]
			},
			{
				name: "Post Secondary and Early Career Years",
				val: "100000000",
				mention: [
					"Credit Services", "Financial Planning"
				]
			},
			{
				name: "Retired",
				val: "100000003",
				mention: [
					"Estate Planning", "Optimizing Taxes"
				]
			}
		];

		static getLifeStageVal(lifeStage: string): string {
			for (let index = 0; index < LifeStage.LifeStages.length; index++) {
				const element = LifeStage.LifeStages[index];
				if (element.name == lifeStage) {
					return element.val;
				}
			}
			return "";
		}

		constructor() {
			this.LILifeStages = [];
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
			Common.Instance.log('LifeStage init');
			this.Context = context;
			this.NotifyOutputChanged = notifyOutputChanged;
			this.Container = container;

			this.loadData(true);
			this.buildDOM();
			this.selectLifeStage();
		}

		/**
		 * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
		 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
		 */
		public updateView(context: ControlFramework.Context<InputsOutputs.IInputs>): void {
			Common.Instance.log('LifeStage updateView');

			//BOHDAN
			this.Context = context;
			this.loadData(false);
			this.selectLifeStage();
		}

		/** 
		 * It is called by the framework prior to a control receiving new data. 
		 * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
		 */
		public getOutputs(): InputsOutputs.IOutputs {
			return {
				LifeStage: LifeStage.getLifeStageVal(this.LifeStageStr)
			};
		}

		/** 
 		 * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
		 * i.e. cancelling any pending remote calls, removing listeners, etc.
		 */
		public destroy(): void {
			//
		}

		loadData(setOrigin: boolean) {
			this.D365PropertyName = this.Context.parameters.LifeStage.attributes.LogicalName;
			// Bohdan hack
			this.D365EntityName = (<any>this.Context).page.entityTypeName;

			this.LifeStageStr = this.Context.parameters.LifeStage.formatted;
			if (setOrigin) {
				this.LifeStageStrOriginal = this.LifeStageStr;
			}
		}


		buildDOM() {
			//clean if something is there
			while (this.Container.firstChild) {
				this.Container.removeChild(this.Container.firstChild);
			}

			var table = <HTMLTableElement>(document.createElement('table'));
			this.Container.appendChild(table);
			this.Table = table;

			var saveButton = <any>(document.createElement('button'));
			this.Container.appendChild(saveButton);
			saveButton.LSO = this;
			saveButton.onclick = this.OnClickSaveButton;
			saveButton.innerText = "Save";
			this.SaveButton = saveButton;

			var tr = <HTMLTableRowElement>(document.createElement('tr'));
			table.appendChild(tr);

			var td1 = <HTMLTableDataCellElement>(document.createElement('td'));
			tr.appendChild(td1);
			td1.classList.add("tdLeft");

			var div1 = <HTMLDivElement>(document.createElement('div'));
			td1.appendChild(div1);
			div1.innerText = "Life Stage";

			var ul1 = <HTMLUListElement>(document.createElement('ul'));
			td1.appendChild(ul1);

			for (let index = 0; index < LifeStage.LifeStages.length; index++) {
				const element = LifeStage.LifeStages[index];

				let li: any = (document.createElement('li'));
				ul1.appendChild(li);

				li.innerText = element.name;
				li.LSO = this;
				li.onclick = this.OnClickLifeStage;

				this.LILifeStages.push(li);
			}

			this.TD2 = <HTMLTableDataCellElement>(document.createElement('td'));
			tr.appendChild(this.TD2);
			this.TD2.classList.add("tdRight");
		}

		OnClickLifeStage(e: MouseEvent): void {
			let li: any = <any>(this);
			let LSO: LifeStage = li.LSO;
			LSO.LifeStageStr = li.innerText;
			LSO.selectLifeStage();
			if (LSO.LifeStageStrOriginal != LSO.LifeStageStr) {
				LSO.NotifyOutputChanged();
			}
		}


		OnClickSaveButton(e: MouseEvent): void {
			let li: any = <any>(this);
			let LSO: LifeStage = li.LSO;


			var lifeStageVal = LifeStage.getLifeStageVal(LSO.LifeStageStr);

			if (lifeStageVal == "") {
				return;
			}

			LSO.SaveButton.classList.remove("visible");

			var data: any = {};
			data[LSO.D365PropertyName] = lifeStageVal;

			var here: LifeStage = LSO;

			// Bohdan hack
			let entityId = (<any>LSO.Context).page.entityId;
			Xrm.WebApi.updateRecord(LSO.D365EntityName, entityId, data).then(
				function success(result: any) {
					here.LifeStageStrOriginal = here.LifeStageStr;
					Common.Instance.wait(1000);
					here.selectLifeStage();
				},
				function (error: any) {
					console.log(error.message);
				}
			);

		}

		selectLifeStage() {
			let lifeStage: string = this.LifeStageStr;

			if (lifeStage == undefined || lifeStage == "") {
				return;
			}

			for (let index = 0; index < this.LILifeStages.length; index++) {
				let element: HTMLLIElement = this.LILifeStages[index];
				if (element.innerText == lifeStage) {
					element.classList.add("current");
				}
				else {
					element.classList.remove("current");
				}
			}

			var mention: Array<string> = [];
			for (let index = 0; index < LifeStage.LifeStages.length; index++) {
				let element = LifeStage.LifeStages[index];
				if (element.name == lifeStage) {
					mention = element.mention;
					break;
				}
			}

			this.renderTD2(mention);

			if (this.LifeStageStr != this.LifeStageStrOriginal) {
				this.SaveButton.classList.add("visible");
			}
			else {
				this.SaveButton.classList.remove("visible");
			}
		}

		renderTD2(mention: string[]) {

			while (this.TD2.firstChild) {
				this.TD2.removeChild(this.TD2.firstChild);
			}

			var div2 = <HTMLDivElement>(document.createElement('div'));
			this.TD2.appendChild(div2);
			div2.innerText = "Mention";

			var ul2 = <HTMLUListElement>(document.createElement('ul'));
			this.TD2.appendChild(ul2);

			for (let index = 0; index < mention.length; index++) {
				const element = mention[index];

				let li = <HTMLLIElement>(document.createElement('li'));
				ul2.appendChild(li);

				li.innerText = element;
			}

		}

	}
}