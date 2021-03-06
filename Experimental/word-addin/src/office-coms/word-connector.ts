export interface IGetRecordUriResponse {
	found: boolean;
	uri: number;
	message?: string;
}

export interface IWordUrl {
	getWebUrl(): string;
}

export interface IWordConnector extends IWordUrl {
	getAccessToken(): Promise<string>;
	getUri(): Promise<IGetRecordUriResponse>;
	setUri(uri: number): Promise<IGetRecordUriResponse>;
	getName(): string;
	insertText(textToInsert: string): void;
	setAutoOpen(autoOpen: boolean): void;
	getAutoOpen(): boolean;
}

export class WordConnector implements IWordConnector {
	setAutoOpen(autoOpen: boolean): void {
		Office.context.document.settings.set(
			"Office.AutoShowTaskpaneWithDocument",
			autoOpen
		);
		Office.context.document.settings.saveAsync();
	}
	getAutoOpen(): boolean {
		const autoOpen = Office.context.document.settings.get(
			"Office.AutoShowTaskpaneWithDocument"
		);

		return autoOpen;
	}
	public getWebUrl() {
		return Office.context.document.url;
	}

	public getName(): string {
		const tokens = this.getWebUrl().split("/");
		return tokens[tokens.length - 1].split(".")[0];
	}

	public insertText(textToInsert: string): void {
		Office.context.document.setSelectedDataAsync(
			textToInsert,
			{},
			(asyncResult: any) => {
				if (asyncResult.status == Office.AsyncResultStatus.Failed) {
					//write(asyncResult.error.message);
				}
			}
		);
	}

	public setUri(uri: number): Promise<IGetRecordUriResponse> {
		return new Promise((resolve, reject) => {
			const response = { found: false, uri: 0, message: "" };

			Word.run((context) => {
				const customProp = context.document.properties.customProperties.add(
					"CM_Record_Uri",
					String(uri)
				);
				return context
					.sync()
					.then(() => {
						const v = customProp.value;
						if (v) {
							response.uri = Number(v);
						}
						response.found = true;
						resolve(response);
					})
					.catch((error) => {
						resolve(response);
					});
			});
		});
	}

	public getUri(): Promise<IGetRecordUriResponse> {
		return new Promise((resolve, reject) => {
			const response = { found: false, uri: 0, message: "" };

			Word.run((context) => {
				const customProps = context.document.properties.customProperties;
				context.load(customProps);

				const customProp = customProps.getItem("CM_Record_Uri");
				context.load(customProp);

				return context
					.sync()
					.then(() => {
						const v = customProp.value;

						if (v) {
							response.uri = Number(v);
							if (response.uri > 0) {
								response.found = true;
							}
						}
						resolve(response);
					})
					.catch((myError) => {
						//  response.message = myError.message || myError;
						resolve(response);
					});
			});
		});
	}

	public getAccessToken(): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			// if (Office.context.requirements.isSetSupported("IdentityAPI", 1.1)) {
			// 	reject({ message: "Identity not supported." });
			// } else {

			(Office.context["auth"] as any).getAccessTokenAsync(
				{ forceConsent: false },
				(result: any) => {
					if (result.status === "succeeded") {
						resolve(result.value);
					} else {
						reject({ message: result.error });
					}
				}
			);
		});
	}
}
export default WordConnector;
