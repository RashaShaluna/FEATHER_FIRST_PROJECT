function handleFormSubmition(event){ 
    event.preventDefault();
    if(!validateForm()){
      return 
    }
    const name = document.getElementsByName('name')[0].value;
    const description = document.getElementById('descriptionId').value;
  
    fetch('/admin/addCategory',{
      method:'POST',
      headers:{
        'content-type':'application/json'
      },
      body:JSON.stringify({name,description})
    })
    .then(response =>{
      if(!response.ok){
        return response.json().then(err =>{
          throw new Error(err.error);
        })
      }
      return response.json();
    })
    .then(data =>{
      location.reload();
    })
    .catch(error=>{
      if(error.message === 'Category already exists'){
        Swal.fire({
          icon:'error',
          title:'Oops',
          text:'Category already exists'
        })
      }else{
        Swal.fire({
          icon:'error',
          title:'Oops',
          text:'An error occured while adding the category',
        })
      }
    })
  
  
  function validateForm(){
    clearErrorMessage();
    const name = document.getElementsByName('name')[0].value.trim();
    const description = document.getElementById('descriptionId').value.trim();
    isValid = true;
  
       if(name=== ''){
        displayErrorMessage('name-error','Please enter a name');
        isValid= false;
       }
  
       if(description == ''){
        displayErrorMessage('description-error','Please enter a description ');
        isValid = false;
       }
       return isValid;
  }
  
  
  function displayErrorMessage(elementId,message){
    var errorElement = document.getElementById(elementId);
    errorElement.innerText = message;
    errorElement.style.display = 'block';
  }
  
  function clearErrorMessage(){
    const errorElement = document.getElementsByName('error-message');
    Array.from(errorElements).forEach((element)=>{
      element.innerText ='';
      element.style.display = 'none'
    });
  }
  
  }


  <div class="main-panel">
  <div class="content-wrapper">
      <div class="col-lg-12 grid-margin stretch-card ">
      <div class="card">
        <div class="card-body">
          <div class="mb-3">
            <div class="mb-3">
            </div>
              <h3 class="card-title fs-5">Category Table</h3>
          </div>
          
          <form id="categoryForm" action="/admin/addCategory" method="post" class="add-box" >
              <br><br>
              <label for="categoryName">Category Name:</label><br>
              <input type="text" id="name" name="name" ><br><br>
              <span id="name-error" class="error-message" style="display:none;color:red;"></span><br>

              <label for="categoryDescription">Description:</label><br>
              <textarea id="description"  name="description" ></textarea><br><br>
              <span id="description-error" class="error-message" style="display:none;color:red;"></span><br>


              <input type="submit" value="Submit"  class="btn sub-btn">
          </form>

          <!-- Success Modal -->
          <!-- <div class="modal" id="successModal">
              <div class="modal-dialog">
                  <div class="modal-content">
                      <div class="modal-header">
                          <h5 class="modal-title">Success!</h5>
                          <button type="button" class="close" data-dismiss="modal">&times;</button>
                      </div>
                      <div class="modal-body">
                          <p>Category added successfully!</p>
                      </div>
                  </div>
              </div>
          </div>

          <!-Error Modal --
          <div class="modal" id="errorModal">
              <div class="modal-dialog">
                  <div class="modal-content">
                      <div class="modal-header">
                          <h5 class="modal-title">Error!</h5>
                          <button type="button" class="close" data-dismiss="modal">&times;</button>
                      </div>
                      <div class="modal-body">
                          <p>Category with this name already exists.</p>
                      </div>
                  </div>
              </div>
          </div>  -->
        </div> 

      </div>     
    </div>
    <div class="mt-3   btn">
      <a href="/admin/category" class="back-button" >Back to Category</a>
      
    </div>
  </div>

 </div>
</div>


function handleFormSubmition(event){ 
    event.preventDefault();
    if(!validateForm()){
      return 
    }
    const name = document.getElementsByName('name')[0].value;
    const description = document.getElementById('description').value;
  
    fetch('/admin/addCategory',{
      method:'POST',
      headers:{
        'content-type':'application/json'
      },
      body:JSON.stringify({name,description})
    })
    .then(response =>{
      if(!response.ok){
        return response.json().then(err =>{
          throw new Error(err.error);
        })
      }
      return response.json();
    })
    .then(data =>{
      location.reload();
    })
    .catch(error=>{
      if(error.message === 'Category already exists'){
        Swal.fire({
          icon:'error',
          title:'Oops',
          text:'Category already exists'
        })
      }else{
        Swal.fire({
          icon:'error',
          title:'Oops',
          text:'An error occured while adding the category',
        })
      }
    })
  
  
  function validateForm(){
    clearErrorMessage();
    const name = document.getElementsByName('name')[0].value.trim();
    const description = document.getElementById('description').value.trim();
    isValid = true;
  
       if(name=== ''){
        displayErrorMessage('name-error','Please enter a name');
        isValid= false;
       }
  
       if(description == ''){
        displayErrorMessage('description-error','Please enter a description ');
        isValid = false;
       }
       return isValid;
  }
  
  
  function displayErrorMessage(elementId,message){
    var errorElement = document.getElementById(elementId);
    errorElement.innerText = message;
    errorElement.style.display = 'block';
  }
  
  function clearErrorMessage(){
    const errorElement = document.getElementsByName('error-message');
    Array.from(errorElements).forEach((element)=>{
      element.innerText ='';
      element.style.display = 'none'
    });
  }
}

{/* form */}
{/* <!-- list and unlist option --> */}
                                <form id="toggleForm_<%= category._id %>" action="/admin/category/<%= category._id %>/toggle" method="post" style="display: inline;">
                                  <% if(category.listed){ %>
                                  <button id="toggleButton_<%= category._id %>"  type="button" onclick="submitForm('<%= category._id %>','<%= category.listed %>','<%= index %>')"  class="btn btn-warning" data-toggle="modal" data-target="#confirmationModal">
                                      <%= category.listed ? 'Unlist' : 'List' %>
                                  </button>
                                  <%}else{%>
                                    <button id="toggleButton_<%= category._id %>"  type="button" onclick="submitForm('<%= category._id %>','<%= category.listed %>','<%= index %>')"  class="btn btn-success" data-toggle="modal" data-target="#confirmationModal">
                                      <%= category.listed ? 'Unlist' : 'List' %>
                                  </button>
                                    <% } %>
                                    
                                  <input type="hidden" name="_method" value="PUT">
                                  <input type="hidden" name="listed" value="<%= !category.listed %>">
                                  
                              </form>


                              {/* edit */}
                              <td> 
                                <!-- edit option -->
                               <a href="#" class="edit-category" data-category-id="<%= category._id %>" data-category-name="<%= category.name %>" data-category-description="<%= category.description %>"><i class="fas fa-edit"></i> </a>

                               <!-- delete option -->
                               <a href="/admin/categories/delete/<%= category._id %>" class=""><i class="fas fa-trash-alt"></i></a>
                              </td>



                              {/* cat edit */}
                              <!-- category edit function -->
    <script>
      document.addEventListener("DOMContentLoaded", function() {
          // Get all elements with class "edit-category"
          const editButtons = document.querySelectorAll(".edit-category");
      
          // Add click event listener to each edit button
          editButtons.forEach(function(button) {
              button.addEventListener("click", function(event) {
                  event.preventDefault(); // Prevent default link behavior
      
                  // Extract data attributes
                  const categoryId = button.getAttribute("data-category-id");
                  let categoryName = button.getAttribute("data-category-name");
                  let categoryDescription = button.getAttribute("data-category-description");
      
                  // Open SweetAlert modal
                  Swal.fire({
                      title: 'Edit Category',
                      html: `
                          <input type="text" id="categoryName" name="name" class="swal2-input" value="${categoryName}" placeholder="Category Name">
                          <textarea id="categoryDescription" description="description" class="swal2-textarea" placeholder="Category Description">${categoryDescription}</textarea>
                      `,
                      showCancelButton: true,
                      confirmButtonText: 'Save',
                      cancelButtonText: 'Cancel',
                      preConfirm: () => {
                          // Retrieve edited values
                          const editedName = Swal.getPopup().querySelector('#categoryName').value.trim();
                          const editedDescription = Swal.getPopup().querySelector('#categoryDescription').value.trim();
      
                          // Validate input values
                          if (editedName === '' || editedDescription === '') {
                              Swal.showValidationMessage('Please fill in all fields.');
                              return false; // Prevent the modal from closing
                          }
      
                          // Proceed with the fetch request if validation passes
                          fetch('/admin/update-category', {
                              method: 'POST',
                              headers: {
                                  'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({
                                  categoryId: categoryId,
                                  editedName: editedName,
                                  editedDescription: editedDescription
                              })
                          })
                          .then(response => {
                              // Handle response here
                          })
                          .catch(error => {
                              console.error('Error:', error);
                          });
      
                          // Return the edited values
                          return {
                              categoryName: editedName,
                              categoryDescription: editedDescription
                          };
                      }
                  }).then((result) => {
                      // Update the button's data attributes with the edited values
                      if (result.isConfirmed) {
                          button.setAttribute("data-category-name", result.value.categoryName);
                          button.setAttribute("data-category-description", result.value.categoryDescription);
                      }
                  });
              });
          });
      });
      </script>
      

      
      <script>
        document.addEventListener("DOMContentLoaded", function() {
    // Get all elements with class "edit-category"
    const editButtons = document.querySelectorAll(".edit-category");

    // Add click event listener to each edit button
    editButtons.forEach(function(button) {
        button.addEventListener("click", function(event) {
            event.preventDefault(); // Prevent default link behavior

            // Extract data attributes
            const categoryId = button.getAttribute("data-category-id");
            let categoryName = button.getAttribute("data-category-name");
            let categoryDescription = button.getAttribute("data-category-description");

            // Open SweetAlert modal
            Swal.fire({
                title: 'Edit Category',
                html: `
                    <input type="text" id="categoryName" name="name" class="swal2-input" value="${categoryName}" placeholder="Category Name">
                    <textarea id="categoryDescription" description="description" class="swal2-textarea" placeholder="Category Description">${categoryDescription}</textarea>
                `,
                showCancelButton: true,
                confirmButtonText: 'Save',
                cancelButtonText: 'Cancel',
                preConfirm: async () => {
                    // Retrieve edited values
                    const editedName = Swal.getPopup().querySelector('#categoryName').value.trim();
                    const editedDescription = Swal.getPopup().querySelector('#categoryDescription').value.trim();

                    // Validate input values
                    if (editedName === '' || editedDescription === '') {
                        Swal.showValidationMessage('Please fill in all fields.');
                        return false; // Prevent the modal from closing
                    }

                    try {
                        // Check if category name already exists
                        const response = await fetch('/admin/check-category', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                editedName: editedName,
                                categoryId: categoryId
                            })
                        });
                        const data = await response.json();
                        if (!response.ok) {
                            throw new Error(data.message || 'Failed to check category name');
                        }
                        if (!data.available) {
                            Swal.showValidationMessage('Category name already exists.');
                            return false; // Prevent the modal from closing
                        }
                    } catch (error) {
                        console.error('Error:', error);
                        Swal.showValidationMessage('Failed to check category name.');
                        return false; // Prevent the modal from closing
                    }

                    // Proceed with the fetch request if validation passes
                    const updateResponse = await fetch('/admin/update-category', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            categoryId: categoryId,
                            editedName: editedName,
                            editedDescription: editedDescription
                        })
                    });
                    if (!updateResponse.ok) {
                        throw new Error('Failed to update category');
                    }

                    // Return the edited values
                    return {
                        categoryName: editedName,
                        categoryDescription: editedDescription
                    };
                }
            }).then((result) => {
                // Update the button's data attributes with the edited values
                if (result.isConfirmed) {
                    button.setAttribute("data-category-name", result.value.categoryName);
                    button.setAttribute("data-category-description", result.value.categoryDescription);
                }
            });
        });
    });
});


{/* form */}
<form id="toggleForm_<%= category._id %>" action="/admin/category/<%= category._id %>/toggle" method="post" style="display: inline;">
                                  <% if(category.listed){ %>
                                  <button id="toggleButton_<%= category._id %>"  type="button" onclick="submitForm('<%= category._id %>','<%= category.listed %>','<%= index %>')"  class="btn btn-warning" data-toggle="modal" data-target="#confirmationModal">
                                      <%= category.listed ? 'Unlist' : 'List' %>
                                  </button>
                                  <%}else{%>
                                    <button id="toggleButton_<%= category._id %>"  type="button" onclick="submitForm('<%= category._id %>','<%= category.listed %>','<%= index %>')"  class="btn btn-success" data-toggle="modal" data-target="#confirmationModal">
                                      <%= category.listed ? 'Unlist' : 'List' %>
                                  </button>
                                    <% } %>
                                  <input type="hidden" name="_method" value="PUT">
                                  <input type="hidden" name="listed" value="<%= !category.listed %>">
                                  
                              </form>             


                              <script>
 async function submitForm(id,listed,index) {
  
  console.log(listed)
     const toggleButton = document.getElementById(`toggleButton_${id}`)
      const response = await axios.patch('/admin/list-unlist',{id,listed});

console.log(response.data.status);
      if(response.data.status){
        console.log('ininininin')
        toggleButton.classList.remove('btn-success');
        toggleButton.classList.add('btn-warning');
        toggleButton.innerHTML='Unlist'
        
      }else{
        console.log('in')
        toggleButton.classList.remove('btn-warning')
        toggleButton.classList.add('btn-success')
        toggleButton.innerHTML='List'
      }
  }
</script>


<!-- category list and unlist  -->
<script>
  async function toggleCategory(categoryId, listed) {
      try {
          const response = await fetch(`/admin/categories/${categoryId}/toggle`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ listed: !listed })
          });

          if (!response.ok) {
              throw new Error('Failed to toggle category');
          }

          const button = document.getElementById(`toggleButton_${categoryId}`);
          button.classList.toggle('btn-warning');
          button.classList.toggle('btn-success');
          button.textContent = listed ? 'List' : 'Unlist';
      } catch (error) {
          console.error(error);
      }
  }
</script>


