const fs = require('fs');
const path = require('path');

/**
 * Local file upload helper that mimics the Cloudinary SDK upload response.
 * This makes it trivially simple to swap to Cloudinary in production.
 */
const uploadToStorage = async (fileBuffer, originalName) => {
  const uploadsDir = path.join(__dirname, '../../../uploads');
  
  // Ensure the directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const fileExt = path.extname(originalName) || '.png';
  const fileName = `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;
  const filePath = path.join(uploadsDir, fileName);

  // Write file buffer to disk
  fs.writeFileSync(filePath, fileBuffer);

  // Return secure_url matching the Cloudinary format, using static express uploads path
  return {
    secure_url: `/uploads/${fileName}`,
    public_id: fileName,
  };
};

module.exports = {
  uploadToStorage,
};
