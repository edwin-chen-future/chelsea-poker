import SwiftUI

struct SessionListView: View {
    @EnvironmentObject private var store: SessionStore

    var body: some View {
        Group {
            if store.isLoading && store.sessions.isEmpty {
                ProgressView("Loading sessions…")
            } else if store.sessions.isEmpty {
                ContentUnavailableView(
                    "No Sessions Yet",
                    systemImage: "suit.club.fill",
                    description: Text("Tap + to record your first poker session.")
                )
            } else {
                List(store.sessions) { session in
                    SessionRowView(session: session)
                }
                .listStyle(.plain)
            }
        }
        .task {
            await store.loadSessions()
        }
        .refreshable {
            await store.loadSessions()
        }
        .alert("Error", isPresented: .constant(store.errorMessage != nil)) {
            Button("OK") { store.errorMessage = nil }
        } message: {
            Text(store.errorMessage ?? "")
        }
    }
}

// MARK: - Session Row

private struct SessionRowView: View {
    let session: PokerSession

    var body: some View {
        HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(session.stake)
                    .font(.headline)
                Text(session.location)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                if let date = session.playedAt {
                    Text(date, style: .date)
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                Text(session.formattedAmount)
                    .font(.title3)
                    .fontWeight(.semibold)
                    .foregroundStyle(amountColor(for: session))
                Text(session.formattedDuration)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 4)
    }

    private func amountColor(for session: PokerSession) -> Color {
        if session.isWin { return .green }
        if session.isLoss { return .red }
        return .secondary
    }
}

#Preview {
    SessionListView()
        .environmentObject(SessionStore(service: PreviewSessionService()))
}
