//
//  HuliApp.swift
//  Huli
//
//  Created by Jia Huang on 11/5/24.
//

import SwiftUI
import GoogleSignIn

@main
struct HuliApp: App {
    @State var user: User?
    var body: some Scene {
        WindowGroup {
            ContentView(user: self.$user)
                .onOpenURL { url in
                    GIDSignIn.sharedInstance.handle(url)
                }
                .onAppear {
                    GIDSignIn.sharedInstance.restorePreviousSignIn { user, error in
                        if let user {
                            self.user = .init(name: user.profile?.name ?? "", email: user.profile?.email ?? "")
                        }
                    }
                }
        }
    }
}

struct User {
    var name: String
    var email: String
}
