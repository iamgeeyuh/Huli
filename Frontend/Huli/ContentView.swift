import SwiftUI

struct ContentView: View {
    @Binding var user: User?
    
    var body: some View {
        NavigationView {
            if let user {
                ChatView(user: $user)
            } else {
                LoginView(user: $user)
            }
        }
    }
}
