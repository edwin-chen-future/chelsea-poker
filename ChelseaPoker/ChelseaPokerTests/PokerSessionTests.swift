import XCTest
@testable import ChelseaPoker

final class PokerSessionTests: XCTestCase {

    // MARK: - JSON Decoding

    func testDecodeFullSessionFromSnakeCaseJSON() throws {
        let json = """
        {
            "id": 42,
            "stake": "$1/$2",
            "duration_minutes": 180,
            "amount": 250,
            "location": "Bike Casino",
            "played_at": "2026-03-15T20:00:00Z"
        }
        """.data(using: .utf8)!

        let session = try makeDecoder().decode(PokerSession.self, from: json)

        XCTAssertEqual(session.id, 42)
        XCTAssertEqual(session.stake, "$1/$2")
        XCTAssertEqual(session.durationMinutes, 180)
        XCTAssertEqual(session.amount, 250)
        XCTAssertEqual(session.location, "Bike Casino")
        XCTAssertNotNil(session.playedAt)
    }

    func testDecodeSessionWithNullOptionals() throws {
        let json = """
        {
            "id": null,
            "stake": "$2/$5",
            "duration_minutes": 60,
            "amount": -100,
            "location": "Home Game",
            "played_at": null
        }
        """.data(using: .utf8)!

        let session = try makeDecoder().decode(PokerSession.self, from: json)

        XCTAssertNil(session.id)
        XCTAssertNil(session.playedAt)
        XCTAssertEqual(session.amount, -100)
    }

    func testDecodeSessionArray() throws {
        let json = """
        [
            {"id": 1, "stake": "$1/$2", "duration_minutes": 60, "amount": 100, "location": "A", "played_at": null},
            {"id": 2, "stake": "$2/$5", "duration_minutes": 90, "amount": -50, "location": "B", "played_at": null}
        ]
        """.data(using: .utf8)!

        let sessions = try makeDecoder().decode([PokerSession].self, from: json)

        XCTAssertEqual(sessions.count, 2)
        XCTAssertEqual(sessions[0].id, 1)
        XCTAssertEqual(sessions[1].amount, -50)
    }

    // MARK: - JSON Encoding

    func testEncodeNewSessionRequest() throws {
        let request = NewSessionRequest(
            stake: "$1/$2",
            durationMinutes: 120,
            amount: 300,
            location: "Commerce"
        )
        let data = try JSONEncoder().encode(request)
        let dict = try JSONSerialization.jsonObject(with: data) as! [String: Any]

        XCTAssertEqual(dict["stake"] as? String, "$1/$2")
        XCTAssertEqual(dict["duration_minutes"] as? Int, 120)
        XCTAssertEqual(dict["amount"] as? Int, 300)
        XCTAssertEqual(dict["location"] as? String, "Commerce")
    }

    // MARK: - Computed Properties

    func testIsWinWhenAmountPositive() {
        let session = makeSession(amount: 100)
        XCTAssertTrue(session.isWin)
        XCTAssertFalse(session.isLoss)
        XCTAssertFalse(session.isBreakeven)
    }

    func testIsLossWhenAmountNegative() {
        let session = makeSession(amount: -50)
        XCTAssertFalse(session.isWin)
        XCTAssertTrue(session.isLoss)
        XCTAssertFalse(session.isBreakeven)
    }

    func testIsBreakevenWhenAmountZero() {
        let session = makeSession(amount: 0)
        XCTAssertFalse(session.isWin)
        XCTAssertFalse(session.isLoss)
        XCTAssertTrue(session.isBreakeven)
    }

    func testFormattedAmountForWin() {
        XCTAssertEqual(makeSession(amount: 250).formattedAmount, "+$250")
    }

    func testFormattedAmountForLoss() {
        XCTAssertEqual(makeSession(amount: -75).formattedAmount, "-$75")
    }

    func testFormattedAmountForBreakeven() {
        XCTAssertEqual(makeSession(amount: 0).formattedAmount, "$0")
    }

    func testFormattedDurationHoursAndMinutes() {
        XCTAssertEqual(makeSession(durationMinutes: 90).formattedDuration, "1h 30m")
    }

    func testFormattedDurationHoursOnly() {
        XCTAssertEqual(makeSession(durationMinutes: 120).formattedDuration, "2h")
    }

    func testFormattedDurationMinutesOnly() {
        XCTAssertEqual(makeSession(durationMinutes: 45).formattedDuration, "45m")
    }

    func testFormattedDurationZeroMinutes() {
        XCTAssertEqual(makeSession(durationMinutes: 0).formattedDuration, "0m")
    }

    // MARK: - Equatable

    func testSessionEquality() {
        let a = makeSession(amount: 100)
        let b = makeSession(amount: 100)
        XCTAssertEqual(a, b)
    }

    func testSessionInequalityOnAmount() {
        let a = makeSession(amount: 100)
        let b = makeSession(amount: 200)
        XCTAssertNotEqual(a, b)
    }

    // MARK: - Helpers

    private func makeDecoder() -> JSONDecoder {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .iso8601
        return d
    }

    private func makeSession(amount: Int = 0, durationMinutes: Int = 60) -> PokerSession {
        PokerSession(
            id: 1,
            stake: "$1/$2",
            durationMinutes: durationMinutes,
            amount: amount,
            location: "Test",
            playedAt: nil
        )
    }
}
