import SwiftUI

struct Message: Identifiable, Codable {
    let id = UUID()
    let text: String
    let isUserMessage: Bool
}
