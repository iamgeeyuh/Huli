import SwiftUI
import GoogleSignInSwift
import GoogleSignIn

struct ContentView: View {
    @Binding var user: User?
    @State private var messages: [Message] = []
    @State private var currentMessage = ""
    @State private var isLoading = false
    
    var body: some View {
        VStack {
            VStack {
                Image("Huli")
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(width: 250, height: 250)
            }
            if let user {
                Text("Hello \(user.name)")
                Button {
                    GIDSignIn.sharedInstance.signOut()
                    GIDSignIn.sharedInstance.disconnect()
                    self.user = nil
                    self.messages = []
                } label: {
                    Text("Log out")
                }
            } else {
                Button {
                    handleSignIn()
                } label: {
                    Text("Log in with Google")
                }
            }
            ScrollView {
                VStack(spacing: 8) {
                    ForEach(messages) { message in
                        ChatBubble(message: message)
                    }
                }
                .padding()
            }
            ChatBar(currentMessage: $currentMessage, sendMessage: sendMessage)
        }
        .navigationTitle("Chatbot")
        .onAppear {
            if let user = user {
                fetchMessages()
            }
        }
    }
    
    private func fetchMessages() {
        guard let url = URL(string: "\(AppConfig.backendURL)/chat") else { return }
        
        isLoading = true
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(getToken())", forHTTPHeaderField: "Authorization")
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                isLoading = false
            }
            if let error = error {
                print("Error fetching messages: \(error)")
                return
            }
            guard let data = data else { return }
            do {
                let fetchedMessages = try JSONDecoder().decode([Message].self, from: data)
                DispatchQueue.main.async {
                    self.messages = fetchedMessages
                }
            } catch {
                print("Error decoding messages: \(error)")
            }
        }.resume()
    }
    
    private func sendMessage() {
        guard !currentMessage.isEmpty, let user = user else { return }
        
        let userMessage = Message(text: currentMessage, isUserMessage: true)
        messages.append(userMessage)
        currentMessage = ""
        
        let newMessage = ["message": ["text": userMessage.text, "isUserMessage": true]]
        
        guard let url = URL(string: "\(AppConfig.backendURL)/chat/test-chat") else { return }
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
                DispatchQueue.main.async {
                    self.messages.append(botResponse)
                }
            } catch {
                print("Error decoding bot response: \(error)")
            }
        }.resume()
    }
    
    
    func handleSignIn() {
        if let rootViewController = getRootViewController() {
            GIDSignIn.sharedInstance.signIn(
                withPresenting: rootViewController
            ) { result, error in
                guard let result else {
                    // inspect error
                    return
                }
                self.user = User.init(name: result.user.profile?.name ?? "", email: result.user.profile?.email ?? "")
                fetchMessages()
            }
        }
    }
}

func getRootViewController() -> UIViewController? {
    guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
          let rootViewController = scene.windows.first?.rootViewController else { return nil }
    return getVisibleViewController(from: rootViewController)
}

func getVisibleViewController(from vc: UIViewController) -> UIViewController? {
    if let nav = vc as? UINavigationController {
        return getVisibleViewController(from: nav.visibleViewController!)
    }
    if let tab = vc as? UITabBarController {
        return getVisibleViewController(from: tab.selectedViewController!)
    }
    if let presented = vc.presentedViewController {
        return getVisibleViewController(from: presented)
    }
    return vc
}

func getToken() -> String {
    // Retrieve and return the ID token stored during Google Sign-In
    return GIDSignIn.sharedInstance.currentUser?.idToken?.tokenString ?? ""
}
