document.addEventListener('DOMContentLoaded', function() {
    const img = new Image();
    img.onload = function() {
        // Image loaded successfully, use it
    };
    img.onerror = function() {
        // Create fallback canvas pallet image
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        
        // Draw pallet
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(50, 50, 200, 20);  // top board
        ctx.fillRect(50, 130, 200, 20); // bottom board
        ctx.fillRect(60, 80, 30, 40);   // left block
        ctx.fillRect(135, 80, 30, 40);  // middle block
        ctx.fillRect(210, 80, 30, 40);  // right block
        
        // Save as image
        const dataUrl = canvas.toDataURL();
        document.querySelector('.dashboard-btn[href*="companies"]').style.backgroundImage = `url(${dataUrl})`;
    };
    img.src = '/static/images/pallet.jpg';
});
