import SwiftUI

struct ContentView: View {
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
            ScrollView {
                VStack(spacing: 8) {
                    ForEach(messages) { message in
                        ChatBubble(message: message)
                    }
                }
                .padding()
            }

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
                .padding(.horizontal) // Padding around the text field
            }
            .padding()
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
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
