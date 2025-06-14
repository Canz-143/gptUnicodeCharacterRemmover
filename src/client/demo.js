// Enhanced client-side implementation with comprehensive watermark detection display
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('watermark-form');
  const inputText = document.getElementById('input-text');
  const resultDiv = document.getElementById('result');
  const statsDiv = document.getElementById('stats');
  const watermarksDiv = document.getElementById('detected-watermarks');
  const loadingIndicator = document.getElementById('loading-indicator');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Show loading indicator
    loadingIndicator.classList.remove('hidden');
    resultDiv.classList.add('hidden');
    statsDiv.classList.add('hidden');
    watermarksDiv.classList.add('hidden');
    
    try {
      const response = await fetch('/api/remove-watermarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText.value,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Display cleaned text
        resultDiv.textContent = data.cleaned;
        resultDiv.classList.remove('hidden');
        
        // Display enhanced stats
        statsDiv.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 class="font-semibold text-blue-800 dark:text-blue-200 mb-2">Text Statistics</h3>
              <p><strong>Original length:</strong> ${data.stats.originalLength} characters</p>
              <p><strong>Cleaned length:</strong> ${data.stats.cleanedLength} characters</p>
              <p><strong>Characters removed:</strong> ${data.stats.charactersRemoved}</p>
              <p><strong>Compression ratio:</strong> ${data.stats.compressionRatio}%</p>
            </div>
            <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h3 class="font-semibold text-green-800 dark:text-green-200 mb-2">Detection Results</h3>
              <p><strong>Watermarks detected:</strong> ${data.stats.watermarksDetected ? 'Yes' : 'No'}</p>
              <p><strong>Control characters:</strong> ${data.stats.controlCharactersFound}</p>
              <p><strong>Invisible characters:</strong> ${data.stats.invisibleCharactersFound}</p>
              <p><strong>Suspicious spacing:</strong> ${data.stats.spacingCharactersFound}</p>
            </div>
          </div>
          
          ${data.analysis && data.analysis.suspiciousPatterns.length > 0 ? `
            <div class="mt-4 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <h3 class="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Analysis Patterns</h3>
              <ul class="list-disc list-inside">
                ${data.analysis.suspiciousPatterns.map(pattern => `<li>${pattern}</li>`).join('')}
              </ul>
              <p class="mt-2"><strong>Confidence Level:</strong> ${data.analysis.confidence}</p>
            </div>
          ` : ''}
          
          ${data.recommendations && data.recommendations.length > 0 ? `
            <div class="mt-4 bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <h3 class="font-semibold text-purple-800 dark:text-purple-200 mb-2">Recommendations</h3>
              <ul class="list-disc list-inside">
                ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        `;
        statsDiv.classList.remove('hidden');
        
        // Display detected watermarks with enhanced information
        if (data.detectedWatermarks.length > 0) {
          const watermarksTable = document.createElement('div');
          watermarksTable.className = 'overflow-x-auto';
          watermarksTable.innerHTML = `
            <table class="min-w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg">
              <thead class="bg-zinc-50 dark:bg-zinc-700">
                <tr>
                  <th class="px-4 py-2 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">Character</th>
                  <th class="px-4 py-2 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">Unicode</th>
                  <th class="px-4 py-2 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">Name</th>
                  <th class="px-4 py-2 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">Category</th>
                  <th class="px-4 py-2 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">Count</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-200 dark:divide-zinc-700">
                ${data.detectedWatermarks.map(wm => `
                  <tr class="hover:bg-zinc-50 dark:hover:bg-zinc-700">
                    <td class="px-4 py-2 text-sm font-mono">${wm.character}</td>
                    <td class="px-4 py-2 text-sm font-mono text-blue-600 dark:text-blue-400">${wm.unicodePoint}</td>
                    <td class="px-4 py-2 text-sm">${wm.name}</td>
                    <td class="px-4 py-2 text-sm">
                      <span class="px-2 py-1 text-xs rounded-full ${getCategoryColor(wm.category)}">
                        ${wm.category}
                      </span>
                    </td>
                    <td class="px-4 py-2 text-sm font-semibold">${wm.count}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `;
          
          watermarksDiv.innerHTML = '';
          watermarksDiv.appendChild(watermarksTable);
          watermarksDiv.classList.remove('hidden');
        } else {
          watermarksDiv.innerHTML = '<div class="text-center py-8 text-zinc-500 dark:text-zinc-400"><p>No watermarks detected in the provided text.</p></div>';
          watermarksDiv.classList.remove('hidden');
        }
      } else {
        // Display error
        resultDiv.innerHTML = `<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"><p class="text-red-800 dark:text-red-200">Error: ${data.message || 'Unknown error'}</p></div>`;
        resultDiv.classList.remove('hidden');
      }
    } catch (error) {
      resultDiv.innerHTML = `<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"><p class="text-red-800 dark:text-red-200">Error: ${error.message || 'Failed to process request'}</p></div>`;
      resultDiv.classList.remove('hidden');
    } finally {
      // Hide loading indicator
      loadingIndicator.classList.add('hidden');
    }
  });
  
  // Enhanced sample text with various watermark types
  const sampleButton = document.getElementById('sample-button');
  if (sampleButton) {
    sampleButton.addEventListener('click', () => {
      // Text with comprehensive hidden watermarks including control characters and invisible characters
      inputText.value = `This​ is⁠ a comprehensive⁠ sample text with⁠ various hidden ⁠watermark⁠ characters​ that⁠ are ⁠invisible ⁠to ⁠the ⁠naked⁠ eye but can be detected by our enhanced tool.‌‍ It includes zero-width characters,‌ control characters, and suspicious spacing.`;
    });
  }
});

// Helper function to get category colors
function getCategoryColor(category) {
  switch (category) {
    case 'Control Character':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
    case 'Invisible Character':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
    case 'Suspicious Spacing':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
  }
}