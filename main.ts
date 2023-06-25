import {
	App,
	Editor, ItemView, KeymapEventHandler, KeymapEventListener, MarkdownRenderChild,
	MarkdownView,
	Menu,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	WorkspaceLeaf
} from 'obsidian'

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

const random = (e: number) => {
	let t = [];
	for (let n = 0; n < e; n++) {
		t.push((16 * Math.random() | 0).toString(16));
	}
	return t.join("")
}

const MACRO_TASK_DELAY = 50

const VIEW_TYPE_EXAMPLE = "example-view";

class ExampleView extends ItemView {
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE_EXAMPLE;
	}

	getDisplayText() {
		return "Example view";
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		container.createEl("h4", { text: "Example view" });
	}

	async onClose() {
		// Nothing to clean up.
	}
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	canvas: any;
	hShortcut: KeymapEventHandler;
	tabShortcut: KeymapEventHandler;
	spaceShortcut: KeymapEventHandler;
	cShortcut: KeymapEventHandler;
	enterShortcut: KeymapEventHandler;
	shiftEnterShortcut: KeymapEventHandler;

	async activateView() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_EXAMPLE);

		await this.app.workspace.getRightLeaf(false).setViewState({
			type: VIEW_TYPE_EXAMPLE,
			active: true,
		});

		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE)[0]
		);
	}

	// sibNodes must have x,y,height,width attributes
	reflow(parentNode, sibNodes) {
		const ROW_GAP = 20
		const COLUMN_GAP = 200

		const bbox = sibNodes.reduce((prev, node, idx) => {
			return idx > 0
				?	{
					height: prev.height + node.height + ROW_GAP,
					heightNodes: prev.heightNodes.concat(node.height),
				}
				:	{
					height: prev.height + node.height,
					heightNodes: prev.heightNodes.concat(node.height),
				}
		}, {
			height: 0,
			heightNodes: [],
		})

		const top = parentNode.y + parentNode.height * 0.5 - bbox.height * 0.5

		const getSum = (arr: number[]) => arr.reduce((sum, cur) => sum + cur, 0)

		sibNodes.forEach((node, i) => {
			if (i === 0) {
				node.moveTo({
					x: parentNode.width + parentNode.x + COLUMN_GAP,
					y: top,
				})
				return
			}

			node.moveTo({
				x: parentNode.width + parentNode.x + COLUMN_GAP,
				y: top + ROW_GAP * i + getSum(bbox.heightNodes.slice(0, i))
			})
		})
	}

	getSingleSelection(): OMM.Node | null {
		const selections = this.canvas.selection

		if (selections === undefined) return null

		if (selections.size !== 1) {
			console.error(`You are using \`getSingleSelection\` function! Expect selected node number is \`1\`, you select \`${selections.size}\``)
			return null
		}

		return selections.values().next().value
	}

	zoomToNode(node: OMM.Node) {
		this.canvas.selectOnly(node)
		this.canvas.zoomToSelection()

		// 魔法打败魔法
		setTimeout(() => node.startEditing(), MACRO_TASK_DELAY)
	}

	getFromNodes(target: OMM.Node) {
		const fromNodeFilter = (edge: OMM.Edge) => edge.to.node.id === target.id

		return this.canvas
			.getEdgesForNode(target)
			.filter(fromNodeFilter)
			.map((edge: OMM.Edge) => edge.from.node)
	}

	getSibNodes(target: OMM.Node) {
		const sibNodeFilter = (sibNode: OMM.Node) => {}

		const fromNodes = this.getFromNodes(target)
		const toNodes = this.getToNodes(fromNodes[0])
		return toNodes.filter(node => node.id !== target.id)
	}

	getToNodes(target: OMM.Node) {
		const toNodeFilter = (edge: OMM.Edge) => edge.from.node.id === target.id

		return this.canvas
			.getEdgesForNode(target)
			.filter(toNodeFilter)
			.map((edge: OMM.Edge) => edge.to.node)
	}


	async onload() {
		await this.loadSettings();

		this.canvas = app.workspace.getActiveViewOfType(ItemView)?.canvas

		this.registerView(
			VIEW_TYPE_EXAMPLE,
			(leaf) => new ExampleView(leaf)
		);

		this.cShortcut = this.app.scope.register([], 'c', () => {
			// const selections = this.canvas.selection
			// if (selections.size !== 1) return

		})

		this.spaceShortcut = this.app.scope.register([], ' ', () => {
			const selection = this.getSingleSelection()
			if (!selection || selection.isEditing) return
			selection.startEditing();
			this.canvas.zoomToSelection();
		})

		this.tabShortcut = this.app.scope.register([], 'Tab', () => {
			const selectionNode = this.getSingleSelection()
			if (!selectionNode) return

			const {
				x,
				y,
				width,
				height,
			} = selectionNode

			// node with from and to attrs we called `Edge`
			// node without from and to but has x,y,width,height attrs we called `Node`
			const rightSideNodeFilter = (node: OMM.Edge) => node?.to?.side === 'left' && selectionNode.id !== node?.to?.node?.id

			// return this.edgeFrom.getArray(e).concat(this.edgeTo.getArray(e))
			const sibNodes = this.canvas
				.getEdgesForNode(selectionNode)
				.filter(rightSideNodeFilter)
				.map((node: OMM.Edge) => node.to.node)

			const childNode = this.canvas.createTextNode({
				pos: {
					x: x + width + 200,
					y: y,
					height: height,
					width: width
				},
				size: {
					x: x + width + 200,
					y: y,
					height: height,
					width: width
				},
				text: "",
				focus: false,
				save: true,
			})

			const data = this.canvas.getData()

			this.canvas.importData({
				"edges": [
					...data.edges,
					{
						"id": random(6),
						"fromNode": selectionNode.id,
						"fromSide": 'right',
						"toNode": childNode.id,
						"toSide": 'left',
					}
				],
				"nodes": data.nodes,
			})

			this.reflow(selectionNode, sibNodes.concat(childNode))

			this.zoomToNode(childNode)
		})

		this.enterShortcut = this.app.scope.register([], 'enter', () => {
			const selectionNode = this.getSingleSelection()
			if (!selectionNode) return

			const {
				x,
				y,
				width,
				height,
			} = selectionNode

			const fromNode = this.getFromNodes(selectionNode)[0]
			const toNodes = this.getToNodes(fromNode)
			const sibNodes = this.getSibNodes(selectionNode)

			const willInsertedNode = this.canvas.createTextNode({
				pos: {
					x: x,
					y: y + height + 20,
					height: height,
					width: width
				},
				size: {
					x: x,
					y: y + height + 20,
					height: height,
					width: width
				},
				text: Date.now() + '',
				focus: false,
				save: true,
			})

			const data = this.canvas.getData()

			this.canvas.importData({
				"edges": [
					...data.edges,
					{
						"id": random(6),
						"fromNode": fromNode.id,
						"fromSide": 'right',
						"toNode": willInsertedNode.id,
						"toSide": 'left',
					}
				],
				"nodes": data.nodes,
			})


			this.reflow(fromNode, toNodes.concat(willInsertedNode))
		})

		this.shiftEnterShortcut = this.app.scope.register(['Shift'], 'enter', () => console.log('shift enter'))

		this.hShortcut = this.app.scope.register([], 'h', () => {
			console.log('canvas:\n', this.canvas)

			const selections = this.canvas.selection.values().next().value
			console.log('selections:\n', selections)
		})

		this.addRibbonIcon("dice", "Activate view", () => {
			this.activateView();
		});

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	console.log('click', evt);
		// });

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {
		this.app.scope.unregister(this.hShortcut)
		this.app.scope.unregister(this.tabShortcut)
		this.app.scope.unregister(this.cShortcut)
		this.app.scope.unregister(this.spaceShortcut)
		this.app.scope.unregister(this.enterShortcut)
		this.app.scope.unregister(this.shiftEnterShortcut)
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

		containerEl.createEl("h1", { text: "Heading 1" });

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
