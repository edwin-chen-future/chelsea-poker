import Foundation

/// In-memory session service used exclusively for SwiftUI previews.
final class PreviewSessionService: SessionServiceProtocol {
    var sessions: [PokerSession]

    init(sessions: [PokerSession] = PreviewSessionService.sampleSessions) {
        self.sessions = sessions
    }

    func createSession(_ request: NewSessionRequest) async throws -> PokerSession {
        let session = PokerSession(
            id: sessions.count + 1,
            stake: request.stake,
            durationMinutes: request.durationMinutes,
            amount: request.amount,
            location: request.location,
            playedAt: Date()
        )
        sessions.insert(session, at: 0)
        return session
    }

    func fetchSessions() async throws -> [PokerSession] {
        sessions
    }

    static let sampleSessions: [PokerSession] = [
        PokerSession(id: 3, stake: "$2/$5", durationMinutes: 240, amount: 650, location: "Bike Casino", playedAt: Date()),
        PokerSession(id: 2, stake: "$1/$2", durationMinutes: 180, amount: -120, location: "Commerce Casino", playedAt: Date(timeIntervalSinceNow: -86400)),
        PokerSession(id: 1, stake: "$1/$3", durationMinutes: 300, amount: 0, location: "Home Game", playedAt: Date(timeIntervalSinceNow: -172800)),
    ]
}
