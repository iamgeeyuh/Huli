import SwiftUI

struct PlayView: View {
    @State private var petImage = "neutral-huli" // Default pet image name
    
    var body: some View {
        ZStack {
            // Background color
            Color.white
                .ignoresSafeArea()
            
            // Pet image at the lower center
            Image(petImage)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: 300, height: 300)
                .position(x: UIScreen.main.bounds.width / 2, y: UIScreen.main.bounds.height - 250) // Move pet image up by 50 points
                .onDrop(of: ["public.text"], isTargeted: nil) { providers in
                    // Handle the drop action to change pet's emotion
                    if let item = providers.first {
                        item.loadItem(forTypeIdentifier: "public.text", options: nil) { data, _ in
                            if let textData = data as? Data, let text = String(data: textData, encoding: .utf8) {
                                DispatchQueue.main.async {
                                    self.petImage = text // Change the pet's emotion image
                                    
                                    DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                                        self.petImage = "neutral-huli"
                                    }
                                }
                            }
                        }
                    }
                    return true
                }
            
            // Icons on the right middle
            VStack(spacing: 20) {
                DraggableIcon(iconName: "cherries", petEmotion: "excited-huli")
                DraggableIcon(iconName: "hand", petEmotion: "petted-huli")
                DraggableIcon(iconName: "moon", petEmotion: "sleeping-huli")
            }
            .frame(maxWidth: .infinity, alignment: .trailing)
            .padding(.trailing, 40)
            .padding(.top, 80) // Move icons up by reducing the top padding
        }
        .padding(.top, -30) // Move the entire ZStack content up by 30 points
    }
}

struct DraggableIcon: View {
    let iconName: String      // Name of the icon image
    let petEmotion: String    // Corresponding pet emotion image
    
    var body: some View {
        Image(iconName)
            .resizable()
            .aspectRatio(contentMode: .fit)
            .frame(width: 50, height: 50)
            .onDrag {
                // Provide the corresponding pet emotion image name as drag data
                NSItemProvider(object: petEmotion as NSString)
            }
    }
}

struct PlayView_Previews: PreviewProvider {
    static var previews: some View {
        PlayView()
    }
}
