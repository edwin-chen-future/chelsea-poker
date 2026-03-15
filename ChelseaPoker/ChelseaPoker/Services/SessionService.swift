import Foundation

enum SessionServiceError: LocalizedError {
    case networkError(Error)
    case serverError(Int, String)
    case decodingError(Error)
    case invalidURL

    var errorDescription: String? {
        switch self {
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .serverError(let code, let message):
            return "Server error (\(code)): \(message)"
        case .decodingError(let error):
            return "Failed to decode response: \(error.localizedDescription)"
        case .invalidURL:
            return "Invalid server URL"
        }
    }
}

protocol SessionServiceProtocol {
    func createSession(_ request: NewSessionRequest) async throws -> PokerSession
    func fetchSessions() async throws -> [PokerSession]
}

final class SessionService: SessionServiceProtocol {
    private let baseURL: URL
    private let urlSession: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    init(
        baseURL: URL = URL(string: "http://localhost:3000")!,
        urlSession: URLSession = .shared
    ) {
        self.baseURL = baseURL
        self.urlSession = urlSession

        self.decoder = JSONDecoder()
        self.decoder.dateDecodingStrategy = .iso8601

        self.encoder = JSONEncoder()
    }

    // MARK: - Public API

    func createSession(_ request: NewSessionRequest) async throws -> PokerSession {
        let url = sessionsURL()
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")

        do {
            urlRequest.httpBody = try encoder.encode(request)
        } catch {
            throw SessionServiceError.decodingError(error)
        }

        let data = try await performRequest(urlRequest)
        return try decodeResponse(PokerSession.self, from: data)
    }

    func fetchSessions() async throws -> [PokerSession] {
        let url = sessionsURL()
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "GET"

        let data = try await performRequest(urlRequest)
        return try decodeResponse([PokerSession].self, from: data)
    }

    // MARK: - Helpers

    private func sessionsURL() -> URL {
        var components = URLComponents(url: baseURL, resolvingAgainstBaseURL: false)!
        components.path = "/api/sessions"
        return components.url!
    }

    private func performRequest(_ request: URLRequest) async throws -> Data {
        let data: Data
        let response: URLResponse

        do {
            (data, response) = try await urlSession.data(for: request)
        } catch {
            throw SessionServiceError.networkError(error)
        }

        if let httpResponse = response as? HTTPURLResponse,
           !(200...299).contains(httpResponse.statusCode) {
            let message = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw SessionServiceError.serverError(httpResponse.statusCode, message)
        }

        return data
    }

    private func decodeResponse<T: Decodable>(_ type: T.Type, from data: Data) throws -> T {
        do {
            return try decoder.decode(type, from: data)
        } catch {
            throw SessionServiceError.decodingError(error)
        }
    }
}
