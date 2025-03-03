import { Telegraf } from 'telegraf';
import Tesseract from 'tesseract.js';
import sharp from 'sharp'; // Import sharp for image preprocessing
import fetch from 'node-fetch'; // For fetching images from Telegram

// Initialize the bot with the provided token
const bot = new Telegraf('8028743206:AAFZQOJ-x7mEJ2hrzjwMr_3bnU7hWVmILwk');

// Command to start the bot and show a welcome message
bot.start((ctx) => {
    ctx.reply('Welcome to the AR Business Card Scanner Bot! Send me a business card image, and I will extract the contact details.');
});

// Handle incoming photo messages (business cards)
bot.on('photo', async (ctx) => {
    // Get the largest file size from the sent images
    const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;

    try {
        // Get the file URL from Telegram servers
        const fileUrl = await ctx.telegram.getFileLink(fileId);
        const response = await fetch(fileUrl);
        const buffer = await response.buffer();

        // Use sharp to preprocess the image (resize, sharpen, convert to grayscale)
        const processedImageBuffer = await sharp(buffer)
            .resize(800) // Resize image to improve OCR
            .grayscale() // Convert to grayscale
            .sharpen()   // Apply sharpening to enhance text edges
            .toBuffer();

        // Use Tesseract.js to perform OCR on the processed image
        const { data: { text } } = await Tesseract.recognize(
            processedImageBuffer,
            'eng',
            {
                logger: (m) => console.log(m), // Log progress
            }
        );

        // Check if OCR text extraction was successful and send it back
        if (text.trim().length > 0) {
            ctx.reply(`I found the following contact details:\n${text}`);
        } else {
            ctx.reply('Sorry, I couldn\'t extract any text from the image. Please try another one.');
        }
    } catch (err) {
        console.error('OCR error:', err);
        ctx.reply('There was an error processing the image. Please try again later.');
    }
});

// Launch the bot
bot.launch();

console.log('Bot is running...');
