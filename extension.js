// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');
var openAI = require('openai');
var MarkdownIt = require('markdown-it');


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "openaicodehelper" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let generatedHelperCommand = generateHelperCommand();
	let generatedOnSelectionHelperCommand = generateOnSelectionHelperCommand();

	context.subscriptions.push(generatedHelperCommand);
	context.subscriptions.push(generatedOnSelectionHelperCommand);

}


function generateHelperCommand() {
	let disposable = vscode.commands.registerCommand('openaicodehelper.openaicodehelper', () => {
		vscode.window.showInputBox({
			placeHolder: "Write your search text"
		}).then((input) => {
			search(input);
		});
	});
	return disposable;
}

function generateOnSelectionHelperCommand() {
	let disposable = vscode.commands.registerCommand('openaicodehelper.openaisearchselection', () => {
		const input = vscode.window.activeTextEditor.selection
		search(vscode.window.activeTextEditor.document.getText(input));
	});
	return disposable;
}


function search(input) {
	const config = vscode.workspace.getConfiguration('openaicodehelper');
	if (!validate(config)) return;
	if (input) {
		vscode.window.showInformationMessage("Loading result...");
		const openai = generateOpenAI(config);
		genereateResponse(input, openai);
	}
}

function validate(config) {
	if (!config.apikey) {
		vscode.window.showErrorMessage("No Open AI key provided in settings.")
		return false;
	}
	return true;
}

function generateOpenAI(config) {
	const configuration = new openAI.Configuration({
		apiKey: config.apikey,
	});
	const openai = new openAI.OpenAIApi(configuration);
	return openai;
}

function genereateResponse(input, openAI) {
	openAI.createCompletion({
		model: "text-davinci-003",
		prompt: input,
		temperature: 0.7,
		max_tokens: 256,
		top_p: 1,
		frequency_penalty: 0,
		presence_penalty: 0,
	}).then((response) => {
		displayResult(response);
	}).catch((error) => vscode.window.showErrorMessage(error.response.data.error.message));
}

function displayResult(openAIResponse) {
	let panel = vscode.window.createWebviewPanel('webview', 
												'AI Result', 
												{ preserveFocus: true, viewColumn: vscode.ViewColumn.One});
	const md = new MarkdownIt();
	const result = md.render('```\n'  + (openAIResponse.data.choices[0].text || "Nothing found") + '\n```' );
	panel.webview.html = result;
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}