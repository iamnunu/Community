import { TrimConnector, SERVICEAPI_BASE_URI } from "./trim-connector";
import * as fetchMock from "fetch-mock";

describe("Test fetch from TRIM", () => {
  const trimConnector = new TrimConnector();

  fetchMock.get("begin:" + SERVICEAPI_BASE_URI + "/Location/me", {
    Results: [
      {
        LocationFullFormattedName: { Value: "david" },
        TrimType: "Location",
        Uri: 1
      }
    ],
    PropertiesAndFields: {},
    TotalResults: 1,
    MinimumCount: 0,
    Count: 0,
    HasMoreItems: false,
    TrimType: "Location",
    ResponseStatus: {}
  });

  fetchMock.get("begin:" + SERVICEAPI_BASE_URI + "/Localisation", {
    Messages: { web_HPRM: "Content Manager" },
    ResponseStatus: {}
  });

  it("the FullFormattedName is david", () => {
    expect.assertions(1);
    return trimConnector.getMe().then(data => {
      expect(data.FullFormattedName.Value).toBe("david");
    });
  });

  it("Application name is Content Manager", () => {
    expect.assertions(1);
    return trimConnector.getMessages().then(data => {
      expect(data.web_HPRM).toBe("Content Manager");
    });
  });

  it("Error is handled", () => {
    fetchMock.reset();
    fetchMock.get("*", {
      body: {
        Results: [],
        PropertiesAndFields: {},
        TotalResults: 0,
        MinimumCount: 0,
        Count: 0,
        HasMoreItems: false,
        TrimType: "Location",
        ResponseStatus: {
          ErrorCode: "ApplicationException",
          Message: "Unable to find object test",
          Errors: []
        }
      },
      status: 500
    });
    expect.assertions(1);
    // expect(appStore.status).toBe("WAITING");
    return trimConnector.getMe().catch(data => {
      // expect(appStore.status).toBe("ERROR");
      expect(data.message).toBe("Unable to find object test");
    });
  });

  it("Get messages error is handled", () => {
    fetchMock.reset();
    fetchMock.get("*", {
      body: {
        ResponseStatus: {
          ErrorCode: "ApplicationException",
          Message: "error",
          Errors: []
        }
      },
      status: 500
    });
    expect.assertions(1);

    return trimConnector.getMessages().catch(data => {
      expect(data.message).toBe("error");
    });
  });
});