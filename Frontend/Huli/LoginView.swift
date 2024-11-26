import SwiftUI
import GoogleSignIn
import GoogleSignInSwift

struct LoginView: View {
    @Binding var user: User?
    
    var body: some View {
        VStack(spacing: 16) {
            Image("Huli")
                .resizable()
                .aspectRatio(contentMode: .fill)
                .frame(width: 250, height: 250)
            
            Text("Welcome to Huli!")
                .font(.largeTitle)
                .fontWeight(.bold)
                .multilineTextAlignment(.center)
                .lineLimit(nil)
            
            Button {
                handleSignIn()
            } label: {
                HStack {
                    Image(systemName: "g.circle.fill")
                        .resizable()
                        .frame(width: 24, height: 24)
                    
                    Text("Log in with Google")
                        .fontWeight(.bold)
                        .font(.system(size: 16))
                }
                .padding()
                .frame(maxWidth: .infinity)
                .background(Color(hex: "#F69B52"))
                .foregroundColor(.white)
                .cornerRadius(10)
            }
        }
        .padding(.horizontal, 40)
        .padding(.vertical, 24)
    }
    
    func handleSignIn() {
        if let rootViewController = getRootViewController() {
            GIDSignIn.sharedInstance.signIn(
                withPresenting: rootViewController,
                hint: nil,
                additionalScopes: ["https://www.googleapis.com/auth/calendar"]
            ) { result, error in
                DispatchQueue.main.async {
                    guard let result else {
                        print("Sign-in failed: \(error?.localizedDescription ?? "Unknown error")")
                        return
                    }
                    self.user = User(name: result.user.profile?.name ?? "", email: result.user.profile?.email ?? "")
                }
            }
        }
    }
}

struct LoginView_Previews: PreviewProvider {
    static var previews: some View {
        LoginView(user: .constant(nil))
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
