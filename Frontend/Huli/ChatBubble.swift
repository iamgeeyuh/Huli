import SwiftUI
import AVFoundation
#if canImport(UIKit)
import UIKit
#endif

struct ChatBubble: View {
    let message: Message
    private let speechSynthesizer = AVSpeechSynthesizer()

    var body: some View {
        VStack(alignment: message.isUserMessage ? .trailing : .leading, spacing: 0) {
            Text(message.text)
                .font(.custom("LucidaGrande", size: 16))
                .lineSpacing(5)
                .padding(.horizontal)
                .padding(.vertical, 10)
                .background(message.isUserMessage ? Color(hex: "#F69B52") : Color.clear)
                .foregroundColor(message.isUserMessage ? .white : .black)
                .cornerRadius(12)
                .frame(maxWidth: message.isUserMessage ? 250 : .infinity, alignment: message.isUserMessage ? .trailing : .leading)
                .background(
                    GeometryReader { geometry in
                        Color.clear
                            .preference(key: TextHeightPreferenceKey.self, value: geometry.size.height)
                    }
                )
            
            HStack(spacing: 8) {
                Button(action: {
                    copyToClipboard(text: message.text)
                }) {
                    Image(systemName: "doc.on.doc")
                        .foregroundColor(.gray)
                }
                .buttonStyle(BorderlessButtonStyle())

                Button(action: {
                    readMessageAloud(text: message.text)
                }) {
                    Image(systemName: "play")
                        .foregroundColor(.gray)
                }
                .buttonStyle(BorderlessButtonStyle())
            }
            .padding(.top, 5)
            .padding(.leading, 15)
            .frame(maxWidth: message.isUserMessage ? 250 : .infinity, alignment: message.isUserMessage ? .trailing : .leading)
        }
        .frame(maxWidth: .infinity, alignment: message.isUserMessage ? .trailing : .leading)
        .padding(message.isUserMessage ? .trailing : .leading, 10)
    }
    
    private func copyToClipboard(text: String) {
        #if canImport(UIKit)
        UIPasteboard.general.string = text
        #endif
    }
    
    private func readMessageAloud(text: String) {
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(language: "en-US")
        speechSynthesizer.speak(utterance)
    }
}

struct TextHeightPreferenceKey: PreferenceKey {
    static var defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = max(value, nextValue())
    }
}
