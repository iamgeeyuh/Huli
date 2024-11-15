import SwiftUI
import GoogleSignInSwift
import GoogleSignIn

struct ContentView: View {
    @Binding var user: User?
    
    @State private var messages: [Message] = [
        Message(text: "Hi there! I’m Huli, your friendly AI pet assistant. I’m here to make life a bit easier and more enjoyable for you.", isUserMessage: false)
    ]
    @State private var currentMessage = ""

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
    
    func handleSignIn() {
        print("signing in")
        if let rootViewController = getRootViewController() {
            GIDSignIn.sharedInstance.signIn(
                withPresenting: rootViewController
            ) { result, error in
                guard let result else {
                    // inspect error
                    return
                }
                self.user = User.init(name: result.user.profile?.name ?? "")
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
