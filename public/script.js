document.getElementById('searchInput').addEventListener('input', updateProducts);

document.getElementById('sortSelect').addEventListener('change', () => {
  updateProducts();
});

async function updateProducts() {
  try {
    const name = document.getElementById('searchInput').value;
    const sortBy = document.getElementById('sortSelect').value;

    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, sortBy }),
    });

    if (response.ok) {
      const products = await response.json();
      const container = document.getElementById('productsList');
      container.innerHTML = '';
      
      products.forEach(product => {
        const productElement = `
            <div class="character-container">
              <p><strong>${product.name}</strong></p>
              ${product.image? `<img src="/images/${product.image}" alt="${product.name}">` : ''}
              <p>${product.description}</p>
              <p>$${product.price}</p>
              <p>${product.stock} available</p>
              <form class="mt-3" action="/addToCart" method="POST">
                <div class="quantity-row">
                  <label for="quantity-${product.name}">Quantity:</label>
                  <input type="number" id="quantity-${product.name}" name="quantity" value="1">
                </div>
                <button type="submit" class="add-to-cart-btn">Add to Cart</button>
                <input type="hidden" name="productId" value="${product._id}">
              </form>
            </div>
        `;
        
        container.innerHTML += productElement;
      });
    } else {
      console.error('Response not ok with status:', response.status);
    }
  } catch (error) {
    console.error('Fetch error:', error.message);
  }
}

updateProducts();
