import SwiftUI
import GoogleSignIn
import AVFoundation
#if canImport(UIKit)
import UIKit
#endif

struct ChatView: View {
    @Binding var user: User?
    @State private var messages: [Message] = []
    @State private var currentMessage = ""
    
    var body: some View {
        VStack {
            Button {
                GIDSignIn.sharedInstance.signOut()
                GIDSignIn.sharedInstance.disconnect()
                self.user = nil
            } label: {
                Text("Log out")
                    .padding()
                    .background(Color.red)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
            .padding()
            
            ScrollView {
                VStack(spacing: 8) {
                    ForEach(messages) { message in
                        VStack(alignment: message.isUserMessage ? .trailing : .leading, spacing: 4) {
                            Text(message.isUserMessage ? (user?.name ?? "You") : "Huli")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .padding(message.isUserMessage ? .trailing : .leading, message.isUserMessage ? 20 : 30)
                            
                            ChatBubble(message: message)
                        }
                    }
                }
                .padding()
            }
            
            ChatBar(currentMessage: $currentMessage, sendMessage: sendMessage)
        }
        .navigationTitle("Chatbot")
        .onAppear {
            fetchMessages()
        }
    }
    
    private func fetchMessages() {
        guard let user = user else { return }
        guard let url = URL(string: "\(AppConfig.backendURL)/chat") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(getToken())", forHTTPHeaderField: "Authorization")
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            guard let data = data, error == nil else {
                print("Failed to fetch messages: \(error?.localizedDescription ?? "Unknown error")")
                return
            }
            
            do {
                let decoder = JSONDecoder()
                decoder.keyDecodingStrategy = .convertFromSnakeCase
                let response = try decoder.decode(ChatHistoryResponse.self, from: data)
                DispatchQueue.main.async {
                    self.messages = response.messages.map { message in
                        Message(
                            text: message.text,
                            isUserMessage: message.isUserMessage
                        )
                    }
                }
            } catch {
                print("Failed to decode response: \(error)")
            }
        }.resume()
    }
    
    private func sendMessage() {
        guard !currentMessage.isEmpty else { return }
        
        let userMessage = Message(text: currentMessage, isUserMessage: true)
        messages.append(userMessage)
        currentMessage = ""
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            let botResponse = Message(text: "This is a bot response!", isUserMessage: false)
            messages.append(botResponse)
        }
    }
    
    func getToken() -> String {
        return GIDSignIn.sharedInstance.currentUser?.idToken?.tokenString ?? ""
    }
}

struct Message: Identifiable {
    let id = UUID()
    let text: String
    let isUserMessage: Bool
}

struct ChatBar: View {
    @Binding var currentMessage: String
    var sendMessage: () -> Void
    
    var body: some View {
        HStack {
            TextField("Chat with Huli", text: $currentMessage)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .padding()
            
            Button(action: sendMessage) {
                Image(systemName: "paperplane.fill")
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .clipShape(Circle())
            }
            .padding()
        }
    }
}

struct ChatBubble: View {
    let message: Message
    private let speechSynthesizer = AVSpeechSynthesizer()
    
    var body: some View {
        VStack(alignment: message.isUserMessage ? .trailing : .leading, spacing: 2) {
            HStack {
                if message.isUserMessage {
                    Spacer()
                    Text(message.text)
                        .padding()
                        .background(Color(hex: "#F69B52"))
                        .foregroundColor(.white)
                        .cornerRadius(10)
                        .padding(.horizontal)
                } else {
                    Text(message.text)
                        .padding(.vertical, 0)
                        .cornerRadius(10)
                        .padding(.horizontal, 30)
                    Spacer()
                }
            }
            HStack(spacing: 10) {
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
            .padding(.top, 6)
            .padding(message.isUserMessage ? .trailing : .leading, message.isUserMessage ? 20 : 29)
        }
        .frame(maxWidth: .infinity, alignment: message.isUserMessage ? .trailing : .leading)
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

struct ChatHistoryResponse: Codable {
    let totalMessages: Int
    let currentPage: Int
    let totalPages: Int
    let messages: [ChatMessage]
}

struct ChatMessage: Codable {
    let text: String
    let isUserMessage: Bool
}

struct ChatView_Previews: PreviewProvider {
    static var previews: some View {
        ChatView(user: .constant(User(name: "Test User")))
    }
}