import SwiftUI

struct Message: Identifiable {
    let id = UUID()
    let text: String
    let isUserMessage: Bool
}
