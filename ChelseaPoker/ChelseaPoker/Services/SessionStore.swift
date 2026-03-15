import Foundation

@MainActor
final class SessionStore: ObservableObject {
    @Published var sessions: [PokerSession] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let service: SessionServiceProtocol

    init(service: SessionServiceProtocol = SessionService()) {
        self.service = service
    }

    func loadSessions() async {
        isLoading = true
        errorMessage = nil
        do {
            sessions = try await service.fetchSessions()
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func createSession(
        stake: String,
        durationMinutes: Int,
        amount: Int,
        location: String
    ) async throws -> PokerSession {
        let request = NewSessionRequest(
            stake: stake,
            durationMinutes: durationMinutes,
            amount: amount,
            location: location
        )
        let session = try await service.createSession(request)
        sessions.insert(session, at: 0)
        return session
    }
}
