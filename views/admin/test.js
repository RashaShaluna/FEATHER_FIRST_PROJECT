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
