# 📺 YouTube Script

A Chrome Extension that extracts YouTube video transcripts and sends them to AI assistants (ChatGPT, Claude, Gemini, Grok, DeepSeek) with custom prompts.

## ✨ Features

- 🎯 **Extract YouTube Transcripts** - Automatically retrieves video transcripts from any YouTube video with captions
- 🤖 **Multi-AI Support** - Works with ChatGPT, Claude, Gemini, Grok, and DeepSeek
- ✏️ **Custom Prompts** - Customize the prompt sent to the AI assistant
- 💾 **Save Preferences** - Remembers your preferred AI assistant and prompts
- 📋 **Clipboard Integration** - Automatically copies transcript + prompt to clipboard
- 🚀 **One-Click Workflow** - Extract, copy, and open AI assistant in seconds

## 🎬 How It Works

1. **Open a YouTube video** with captions/subtitles available
2. **Click the extension icon** in your browser toolbar
3. **Select your AI assistant** (ChatGPT, Claude, Gemini, Grok, or DeepSeek)
4. **Enter or select a prompt** (e.g., "Summarize this transcript into 10 key takeaways")
5. **Click "Extract & Open AI"**
6. The extension will:
   - Extract the video transcript
   - Format it with your prompt
   - Copy it to your clipboard
   - Open your selected AI assistant in a new tab
7. **Paste (Cmd+V/Ctrl+V)** the content into the AI chat

## 🚀 Installation

### Development Mode

1. **Clone or download this project**

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Load the extension in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `.output/chrome-mv3-dev` folder from this project

5. **Open any YouTube video** and click the extension icon!

### Production Build

```bash
npm run build
```

The production build will be in `.output/chrome-mv3/`

### Create Distribution Package

```bash
npm run zip
```

Creates a `.zip` file ready for Chrome Web Store submission.

## 🎨 Customization

### Quick Prompts

The extension comes with 4 default quick prompts:
- Summarize this transcript into 10 key takeaways
- Create a detailed summary of this video
- Extract the main points and action items
- Provide a comprehensive analysis of the topics discussed

You can click any quick prompt button to instantly use it.

### Supported AI Assistants

| AI Assistant | URL |
|--------------|-----|
| ChatGPT | https://chat.openai.com |
| Claude | https://claude.ai/new |
| Gemini | https://gemini.google.com |
| Grok | https://x.com/i/grok |
| DeepSeek | https://chat.deepseek.com |

## 🛠️ Development

### Project Structure

```
youtube-script/
├── src/
│   ├── entrypoints/           # Extension entry points
│   │   ├── background.ts      # Background service worker
│   │   ├── content.ts         # Content script (runs on YouTube)
│   │   └── popup/             # Extension popup UI
│   ├── services/              # Business logic
│   │   ├── youtubeService.ts  # YouTube transcript extraction
│   │   ├── llmService.ts      # LLM integration
│   │   └── messageService.ts  # Extension messaging
│   ├── hooks/                 # React hooks
│   │   └── useStorage.ts      # Chrome storage wrapper
│   ├── types/                 # TypeScript types
│   │   └── index.ts
│   └── utils/                 # Utilities
├── wxt.config.ts             # WXT configuration
├── tsconfig.json             # TypeScript config
└── package.json              # Dependencies & scripts
```

### Available Scripts

```bash
npm run dev              # Start dev server (Chrome)
npm run dev:firefox      # Start dev server (Firefox)
npm run build            # Build for production
npm run zip              # Create distribution package
npm run compile          # TypeScript type check
npm run lint             # ESLint check
npm run lint:fix         # Auto-fix lint errors
npm run format           # Format code with Prettier
npm run check            # Run all checks
```

### Tech Stack

- **Framework:** [WXT](https://wxt.dev) - Chrome Extension framework
- **UI:** React 19 + TypeScript
- **Build Tool:** Vite
- **Linting:** ESLint (flat config)
- **Formatting:** Prettier

## 📋 Requirements

- **Node.js 18+** - Required for development and building the extension
- **npm 8+** - Package manager (comes with Node.js)
- **YouTube videos must have captions/subtitles** - The extension can only extract transcripts from videos that have captions available (auto-generated or manual)
- **Active internet connection** - Required to open AI assistant pages
- **Modern browser** - Chrome, Edge, or any Chromium-based browser

## 🔒 Permissions

The extension requires the following permissions:

- **activeTab** - To access the current YouTube tab
- **tabs** - To open new tabs with AI assistants
- **storage** - To save user preferences
- **clipboardWrite** - To copy transcript to clipboard
- **host_permissions (youtube.com)** - To extract transcripts from YouTube pages

## 🐛 Troubleshooting

### "Transcript not available" error

- Make sure the video has captions/subtitles enabled
- Click the "CC" button on the YouTube player to verify captions are available
- Try clicking the "Show transcript" button manually on YouTube first

### Extension icon not showing

- Make sure you've loaded the extension in Chrome extensions page
- Refresh the page after loading the extension
- Check that the extension is enabled

### Transcript not copying

- Check browser console for errors
- Make sure clipboard permissions are granted
- Try manually selecting and copying the text

## 📝 License

MIT License - Feel free to use and modify

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 💡 Future Enhancements

- [ ] Support for more AI assistants
- [ ] Custom prompt templates
- [ ] Transcript language selection
- [ ] Export transcript to file
- [ ] Timestamp preservation
- [ ] Auto-paste (if supported by AI platforms)
- [ ] Batch processing multiple videos

## 🙏 Acknowledgments

- Built with [WXT](https://wxt.dev)
- Powered by [React](https://react.dev)
- Uses YouTube's built-in transcript feature
