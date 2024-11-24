// client-side deletion to avoid page reloads
const deleteProduct = (button) => {
  const parent = button.parentNode;
  const prodId = parent.querySelector('[name=productId]').value;
  const csrf = parent.querySelector('[name=_csrf]').value;

  const productElement = button.closest('article');

  fetch('/admin/product/' + prodId, {
    method: 'DELETE',
    headers: {
      'csrf-token': csrf
    }
  })
    .then(result => {
      return result.json();
    })
    .then(data => {
      console.log(data);
      productElement.remove();
    })
    .catch(err => console.log(err));
};
