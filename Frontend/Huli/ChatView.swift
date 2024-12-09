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
    @State private var isSettingsPresented = false // For showing the settings popup
    
    var body: some View {
            VStack {
                HStack {
                    Text("Huli")
                        .font(.system(size: 36, weight: .bold))
                        .padding(.horizontal, 40)
                    Spacer()
                    NavigationLink(destination: PlayView()) {
                        Image(systemName: "heart.fill")
                            .font(.system(size: 24))
                            .foregroundColor(.red)
                            .padding(.trailing, 0)
                    }
                    // Settings Button
                    Button {
                        isSettingsPresented = true
                    } label: {
                        Image(systemName: "gearshape.fill")
                            .font(.system(size: 24))
                            .foregroundColor(Color(hex: "#F69B52"))
                            .padding(.leading, 0)
                    }
                    .padding()
                    .sheet(isPresented: $isSettingsPresented) {
                        SettingsView(user: $user)
                    }
                }
                
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack {
                            ForEach(messages) { message in
                                ChatBubble(message: message)
                                    .onAppear {
                                        // Detect if the user scrolls to the top
                                        if message == messages.first {
                                            loadPreviousMessages()
                                        }
                                    }
                                Spacer()
                            }
                        }
                    }
                    .onChange(of: messages) { _ in
                        // Automatically scroll to the bottom when a new message is added
                        if let lastMessage = messages.last {
                            proxy.scrollTo(lastMessage.id, anchor: .bottom)
                        }
                    }
                }
                
                ChatBar(currentMessage: $currentMessage, sendMessage: sendMessage)
            }
            .onAppear {
                fetchMessages()
            }
    }
    
    private func loadPreviousMessages() {
        // Logic for loading previous messages
        print("Loading previous messages...")
    }
    
    private func fetchMessages() {
        guard user != nil else { return }
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
        guard !currentMessage.isEmpty, let user = user else { return }
        
        let userMessage = Message(text: currentMessage, isUserMessage: true)
        messages.append(userMessage)
        currentMessage = ""
        
        let newMessage = ["message": ["text": userMessage.text, "isUserMessage": true]]
        
        guard let url = URL(string: "\(AppConfig.backendURL)/chat") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(getToken())", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: newMessage)
        } catch {
            print("Error serializing message: \(error)")
            return
        }
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                print("Error sending message: \(error)")
                return
            }
            guard let data = data else { return }
            do {
                let botResponse = try JSONDecoder().decode(Message.self, from: data)
                print(botResponse)
                DispatchQueue.main.async {
                    self.messages.append(botResponse)
                }
            } catch {
                print("Error decoding bot response: \(error)")
            }
        }.resume()
    }
    
    
    func getToken() -> String {
        return GIDSignIn.sharedInstance.currentUser?.idToken?.tokenString ?? ""
    }
    
    func getAccessToken() -> String {
        return GIDSignIn.sharedInstance.currentUser?.accessToken.tokenString ?? ""
    }
}

struct SettingsView: View {
    @Binding var user: User?
    
    var body: some View {
        VStack(spacing: 20) {
            Text("Settings")
                .font(.title)
                .padding()
            
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
            
            Spacer()
        }
        .padding()
    }
}

struct Message: Identifiable, Equatable, Codable {
    let id = UUID()
    let text: String
    let isUserMessage: Bool
}

struct ChatBar: View {
    @Binding var currentMessage: String
    var sendMessage: () -> Void
    
    var body: some View {
        HStack {
            ZStack {
                TextField("Chat with Huli", text: $currentMessage)
                    .padding(7)
                    .padding(.leading, 15)
                    .padding(.trailing, 40)
                    .cornerRadius(25)
                    .overlay(
                        RoundedRectangle(cornerRadius: 25)
                            .stroke(Color.black, lineWidth: 0.5)
                    )
                
                HStack {
                    Spacer()
                    Button(action: sendMessage) {
                        Image(systemName: "paperplane.fill")
                            .foregroundColor(Color(hex: "#F69B52"))
                            .padding(.trailing, 15)
                    }
                }
            }
            .padding(.horizontal)
        }
        .padding()
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
        ChatView(user: .constant(User(name: "Test User", email: "testuser@gmail.com")))
    }
}
