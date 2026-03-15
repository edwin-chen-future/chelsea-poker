import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var store: SessionStore
    @State private var showAddSession = false

    var body: some View {
        NavigationStack {
            SessionListView()
                .navigationTitle("Chelsea Poker")
                .toolbar {
                    ToolbarItem(placement: .primaryAction) {
                        Button {
                            showAddSession = true
                        } label: {
                            Image(systemName: "plus")
                        }
                    }
                }
        }
        .sheet(isPresented: $showAddSession) {
            AddSessionView()
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(SessionStore(service: PreviewSessionService()))
}
