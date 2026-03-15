import Foundation

struct PokerSession: Codable, Identifiable, Equatable {
    let id: Int?
    let stake: String
    let durationMinutes: Int
    /// Dollars: positive = win, negative = loss, zero = breakeven.
    let amount: Int
    let location: String
    let playedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case stake
        case durationMinutes = "duration_minutes"
        case amount
        case location
        case playedAt = "played_at"
    }

    var isWin: Bool { amount > 0 }
    var isLoss: Bool { amount < 0 }
    var isBreakeven: Bool { amount == 0 }

    var formattedAmount: String {
        let absValue = abs(amount)
        if amount > 0 { return "+$\(absValue)" }
        if amount < 0 { return "-$\(absValue)" }
        return "$0"
    }

    var formattedDuration: String {
        let hours = durationMinutes / 60
        let minutes = durationMinutes % 60
        if hours == 0 { return "\(minutes)m" }
        if minutes == 0 { return "\(hours)h" }
        return "\(hours)h \(minutes)m"
    }
}

/// Request body for creating a new session.
struct NewSessionRequest: Encodable {
    let stake: String
    let durationMinutes: Int
    let amount: Int
    let location: String

    enum CodingKeys: String, CodingKey {
        case stake
        case durationMinutes = "duration_minutes"
        case amount
        case location
    }
}
