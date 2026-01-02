// EmojiPickerComponent.tsx
import React, { useCallback } from "react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { customEmojis } from "./custom-emojis";

interface EmojiPickerComponentProps {
  onSelectEmoji: (emoji: string) => void;
}

const EmojiPickerComponent: React.FC<EmojiPickerComponentProps> = ({
  onSelectEmoji,
}) => {
  // Handle emoji selection with proper typing
  const handleEmojiSelect = useCallback((emojiData: any) => {
    console.log("Emoji data received:", emojiData);
    const selectedEmoji = emojiData.native || emojiData.emoji || "";
    console.log("Selected emoji:", selectedEmoji);
    if (selectedEmoji) {
      onSelectEmoji(selectedEmoji);
    }
  }, [onSelectEmoji]);

  return (
    <div 
      className="relative w-full p-0 overflow-auto pointer-events-auto" 
      style={{ pointerEvents: 'auto', zIndex: 9999, minWidth: '320px' }}
      onClick={(e) => e.stopPropagation()}
    >
      <Picker
        data={data}
        custom={customEmojis}
        categories={[
          "activity",
          "objects",
          "people",
          "places",
        ]}
        onEmojiSelect={handleEmojiSelect}
        emojiSize={20}
        showPreview={false}
        showSkinTones={false}
        theme="light"
        navPosition="top"
        maxFrequentRows={0}
        perLine={8}
        set="native"
        dynamicWidth={false}
        previewPosition="none"
        skinTonePosition="none"
      />
    </div>
  );
};

export default EmojiPickerComponent;
