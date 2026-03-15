import SwiftUI

struct AddSessionView: View {
    @EnvironmentObject private var store: SessionStore
    @Environment(\.dismiss) private var dismiss

    @State private var stake = ""
    @State private var durationText = ""
    @State private var amountText = ""
    @State private var isWin = true
    @State private var location = ""
    @State private var isSubmitting = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Form {
                Section("Session Details") {
                    TextField("Stake (e.g. $1/$2)", text: $stake)
                        .autocorrectionDisabled()

                    TextField("Location", text: $location)
                        .autocorrectionDisabled()

                    TextField("Duration (minutes)", text: $durationText)
                        .keyboardType(.numberPad)
                }

                Section("Result") {
                    Picker("Result", selection: $isWin) {
                        Text("Win").tag(true)
                        Text("Loss").tag(false)
                    }
                    .pickerStyle(.segmented)

                    HStack {
                        Text(isWin ? "+" : "-")
                            .foregroundStyle(isWin ? .green : .red)
                            .fontWeight(.semibold)
                        TextField("Amount ($)", text: $amountText)
                            .keyboardType(.numberPad)
                    }
                }

                if let errorMessage {
                    Section {
                        Text(errorMessage)
                            .foregroundStyle(.red)
                            .font(.callout)
                    }
                }
            }
            .navigationTitle("New Session")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        Task { await submit() }
                    }
                    .disabled(isSubmitting || !isFormValid)
                }
            }
            .disabled(isSubmitting)
            .overlay {
                if isSubmitting {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(.ultraThinMaterial)
                }
            }
        }
    }

    // MARK: - Helpers

    private var isFormValid: Bool {
        !stake.trimmingCharacters(in: .whitespaces).isEmpty &&
        !location.trimmingCharacters(in: .whitespaces).isEmpty &&
        parsedDuration != nil &&
        parsedAmount != nil
    }

    private var parsedDuration: Int? {
        guard let value = Int(durationText.trimmingCharacters(in: .whitespaces)),
              value > 0 else { return nil }
        return value
    }

    private var parsedAmount: Int? {
        guard let value = Int(amountText.trimmingCharacters(in: .whitespaces)),
              value >= 0 else { return nil }
        return isWin ? value : -value
    }

    private func submit() async {
        guard let duration = parsedDuration, let amount = parsedAmount else {
            errorMessage = "Please check your inputs and try again."
            return
        }

        isSubmitting = true
        errorMessage = nil

        do {
            _ = try await store.createSession(
                stake: stake.trimmingCharacters(in: .whitespaces),
                durationMinutes: duration,
                amount: amount,
                location: location.trimmingCharacters(in: .whitespaces)
            )
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }

        isSubmitting = false
    }
}

#Preview {
    AddSessionView()
        .environmentObject(SessionStore(service: PreviewSessionService()))
}
