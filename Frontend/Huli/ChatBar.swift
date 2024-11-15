import SwiftUI

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
