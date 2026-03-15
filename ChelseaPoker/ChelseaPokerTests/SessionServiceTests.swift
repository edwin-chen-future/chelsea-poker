import XCTest
@testable import ChelseaPoker

// MARK: - MockURLProtocol

final class MockURLProtocol: URLProtocol {
    static var requestHandler: ((URLRequest) throws -> (HTTPURLResponse, Data))?

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        guard let handler = MockURLProtocol.requestHandler else {
            client?.urlProtocol(self, didFailWithError: URLError(.unknown))
            return
        }
        do {
            let (response, data) = try handler(request)
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: data)
            client?.urlProtocolDidFinishLoading(self)
        } catch {
            client?.urlProtocol(self, didFailWithError: error)
        }
    }

    override func stopLoading() {}
}

// MARK: - SessionServiceTests

final class SessionServiceTests: XCTestCase {
    var service: SessionService!
    var mockURLSession: URLSession!

    override func setUp() {
        super.setUp()
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [MockURLProtocol.self]
        mockURLSession = URLSession(configuration: config)
        service = SessionService(
            baseURL: URL(string: "http://localhost:3000")!,
            urlSession: mockURLSession
        )
    }

    override func tearDown() {
        MockURLProtocol.requestHandler = nil
        service = nil
        mockURLSession = nil
        super.tearDown()
    }

    // MARK: - createSession

    func testCreateSessionSuccessReturnsDecodedSession() async throws {
        let responseJSON = """
        {"id":1,"stake":"$1/$2","duration_minutes":180,"amount":250,"location":"Bike Casino","played_at":"2026-03-15T20:00:00Z"}
        """.data(using: .utf8)!

        MockURLProtocol.requestHandler = { request in
            XCTAssertEqual(request.httpMethod, "POST")
            XCTAssertEqual(request.value(forHTTPHeaderField: "Content-Type"), "application/json")
            let response = HTTPURLResponse(
                url: request.url!,
                statusCode: 201,
                httpVersion: nil,
                headerFields: nil
            )!
            return (response, responseJSON)
        }

        let req = NewSessionRequest(stake: "$1/$2", durationMinutes: 180, amount: 250, location: "Bike Casino")
        let session = try await service.createSession(req)

        XCTAssertEqual(session.id, 1)
        XCTAssertEqual(session.stake, "$1/$2")
        XCTAssertEqual(session.durationMinutes, 180)
        XCTAssertEqual(session.amount, 250)
        XCTAssertEqual(session.location, "Bike Casino")
        XCTAssertNotNil(session.playedAt)
    }

    func testCreateSessionEncodesRequestBody() async throws {
        let responseJSON = """
        {"id":1,"stake":"$2/$5","duration_minutes":90,"amount":-50,"location":"Home","played_at":null}
        """.data(using: .utf8)!

        var capturedBody: Data?
        MockURLProtocol.requestHandler = { request in
            capturedBody = request.httpBody
            return (HTTPURLResponse(url: request.url!, statusCode: 201, httpVersion: nil, headerFields: nil)!, responseJSON)
        }

        let req = NewSessionRequest(stake: "$2/$5", durationMinutes: 90, amount: -50, location: "Home")
        _ = try await service.createSession(req)

        let body = try XCTUnwrap(capturedBody)
        let dict = try JSONSerialization.jsonObject(with: body) as! [String: Any]
        XCTAssertEqual(dict["stake"] as? String, "$2/$5")
        XCTAssertEqual(dict["duration_minutes"] as? Int, 90)
        XCTAssertEqual(dict["amount"] as? Int, -50)
        XCTAssertEqual(dict["location"] as? String, "Home")
    }

    func testCreateSessionThrowsServerErrorOn400() async {
        let errorBody = #"{"error":"stake is required"}"#.data(using: .utf8)!

        MockURLProtocol.requestHandler = { request in
            return (HTTPURLResponse(url: request.url!, statusCode: 400, httpVersion: nil, headerFields: nil)!, errorBody)
        }

        let req = NewSessionRequest(stake: "", durationMinutes: 60, amount: 100, location: "A")
        do {
            _ = try await service.createSession(req)
            XCTFail("Expected error to be thrown")
        } catch SessionServiceError.serverError(let code, _) {
            XCTAssertEqual(code, 400)
        } catch {
            XCTFail("Unexpected error type: \(error)")
        }
    }

    func testCreateSessionThrowsServerErrorOn500() async {
        MockURLProtocol.requestHandler = { request in
            return (HTTPURLResponse(url: request.url!, statusCode: 500, httpVersion: nil, headerFields: nil)!, Data())
        }

        let req = NewSessionRequest(stake: "$1/$2", durationMinutes: 60, amount: 100, location: "A")
        do {
            _ = try await service.createSession(req)
            XCTFail("Expected error to be thrown")
        } catch SessionServiceError.serverError(let code, _) {
            XCTAssertEqual(code, 500)
        } catch {
            XCTFail("Unexpected error type: \(error)")
        }
    }

    func testCreateSessionThrowsNetworkError() async {
        MockURLProtocol.requestHandler = { _ in
            throw URLError(.notConnectedToInternet)
        }

        let req = NewSessionRequest(stake: "$1/$2", durationMinutes: 60, amount: 100, location: "A")
        do {
            _ = try await service.createSession(req)
            XCTFail("Expected error to be thrown")
        } catch SessionServiceError.networkError {
            // expected
        } catch {
            XCTFail("Unexpected error type: \(error)")
        }
    }

    // MARK: - fetchSessions

    func testFetchSessionsReturnsDecodedArray() async throws {
        let responseJSON = """
        [
            {"id":2,"stake":"$2/$5","duration_minutes":240,"amount":650,"location":"Bike","played_at":"2026-03-15T20:00:00Z"},
            {"id":1,"stake":"$1/$2","duration_minutes":60,"amount":-30,"location":"Home","played_at":"2026-03-14T18:00:00Z"}
        ]
        """.data(using: .utf8)!

        MockURLProtocol.requestHandler = { request in
            XCTAssertEqual(request.httpMethod, "GET")
            return (HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!, responseJSON)
        }

        let sessions = try await service.fetchSessions()

        XCTAssertEqual(sessions.count, 2)
        XCTAssertEqual(sessions[0].id, 2)
        XCTAssertEqual(sessions[0].amount, 650)
        XCTAssertEqual(sessions[1].id, 1)
        XCTAssertEqual(sessions[1].amount, -30)
    }

    func testFetchSessionsReturnsEmptyArray() async throws {
        MockURLProtocol.requestHandler = { request in
            return (HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!, "[]".data(using: .utf8)!)
        }

        let sessions = try await service.fetchSessions()
        XCTAssertEqual(sessions.count, 0)
    }

    func testFetchSessionsThrowsNetworkError() async {
        MockURLProtocol.requestHandler = { _ in
            throw URLError(.timedOut)
        }

        do {
            _ = try await service.fetchSessions()
            XCTFail("Expected error to be thrown")
        } catch SessionServiceError.networkError {
            // expected
        } catch {
            XCTFail("Unexpected error type: \(error)")
        }
    }

    func testFetchSessionsThrowsDecodingError() async {
        MockURLProtocol.requestHandler = { request in
            return (HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!, "not json".data(using: .utf8)!)
        }

        do {
            _ = try await service.fetchSessions()
            XCTFail("Expected error to be thrown")
        } catch SessionServiceError.decodingError {
            // expected
        } catch {
            XCTFail("Unexpected error type: \(error)")
        }
    }
}
