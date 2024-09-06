const fileInputs = [document.getElementById('input1'), document.getElementById('input2'), document.getElementById('input3')];
const modal = document.getElementById('modal');
const image = document.getElementById('image');
const cropButton = document.getElementById('cropBtn');
const uploadButtons = [document.getElementById('uploadButton1'), document.getElementById('uploadButton2'), document.getElementById('uploadButton3')];

let cropperInstances = [];
let croppedBlobs = {};
let currentImageIndex = null;

fileInputs.forEach((fileInput, index) => {
  fileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) {
          currentImageIndex = index;
          const reader = new FileReader();
          reader.onload = (event) => {
              image.src = event.target.result;
              modal.style.display = "flex";

              // Destroy the previous cropper instance if it exists
              if (cropperInstances[currentImageIndex]) {
                  cropperInstances[currentImageIndex].destroy();
              }

              // Initialize the new cropper instance
              cropperInstances[currentImageIndex] = new Cropper(image, {
                  aspectRatio: 1,
                  viewMode: 1,
                  responsive: true,
                  autoCropArea: 0.5,
              });
          };
          reader.readAsDataURL(file);
      }
  });
});

cropButton.addEventListener('click', () => {
  event.preventDefault(); // Prevent form submission

  const cropper = cropperInstances[currentImageIndex];
  if (cropper) {
      const canvas = cropper.getCroppedCanvas({
          width: 200, // Ensure the cropped image is the correct size
          height: 300,
      });

      canvas.toBlob((blob) => {
          croppedBlobs[currentImageIndex] = blob;
          modal.style.display = 'none';

          const cropperContainer = document.getElementById(`cropper-container${currentImageIndex + 1}`);
          const croppedImageElement = document.createElement('img');
          croppedImageElement.src = URL.createObjectURL(blob);
          croppedImageElement.style.width = '200px';
          croppedImageElement.style.height = '300px';
          cropperContainer.innerHTML = '';
          cropperContainer.appendChild(croppedImageElement);
      }, 'image/jpeg');
  }
});
uploadButtons.forEach((uploadButton, index) => {
  uploadButton.addEventListener('click', async (event) => {
      event.preventDefault(); // Prevent form submission

      if (!croppedBlobs[index]) {
          alert('Please crop the image before uploading');
          return;
      }

      const formData = new FormData();
      formData.append('image', croppedBlobs[index], `cropped-image${index + 1}.jpg`);

      try {
          const response = await fetch('/addproduct', {
              method: 'POST',
              body: formData
          });

          if (!response.ok) {
              const errorText = await response.text();
              console.error('Upload failed:', errorText);
              alert(`Error in uploading image: ${errorText}`);
              return;
          }

          const data = await response.json();
          console.log(data);
          alert('Image uploaded successfully');
      } catch (error) {
          console.error('Error in fetch:', error);
          alert(`Error in uploading image: ${error.message}`);
      }
  });
});



<!-- Modal -->
<div id="modal" class="modal mt-5">
  <div class="modal-content">
      <img src="" id="image" alt="">
      <button id="cropBtn" type="button" class="btn btn-md rounded sub-btn w-25 my-3">Crop</button>
    </div>
</div>
<div class="row">
                <!-- Image 1 -->
                <div class="col-12 col-md-6 mb-3">
                    <div class="card-body">
                        <label for="input1">Upload Image 1:</label>
                        <input class="form-control" type="file"  id="input1" accept="image/*">
                        <div id="images-error1" class="error-message mt-2"></div>
                    </div>
                    <div class="image-cropper d-flex flex-column align-items-center" id="cropper-container1">

                    </div>
                    <button type="button" id="uploadButton1" class="btn btn-md rounded sub-btn w-25 my-3">Upload</button>

                </div>
              </div>

                <!-- Image 2 -->
                <div class="row">
                <div class="col-12 col-md-6 mb-3">
                    <div class="card-body">
                        <label for="input2">Upload Image 2:</label>
                        <input class="form-control" type="file"  id="input2" accept="image/*">
                        <div id="images-error2" class="error-message mt-2"></div>
                    </div>
                    <div class="image-cropper d-flex flex-column align-items-center" id="cropper-container2"></div>
                    <button type="button" id="uploadButton2" class="btn btn-md rounded sub-btn w-25 my-3">Upload</button>

                </div>
             </div> 
                <!-- Image 3 -->
                <div class="row">
                <div class="col-12 col-md-6 mb-3">
                    <div class="card-body">
                        <label for="input3">Upload Image 3:</label>
                        <input class="form-control" type="file" id="input3" accept="image/*">
                        <div id="images-error3" class="error-message mt-2"></div>
                    </div>
                    <div class="image-cropper d-flex flex-column align-items-center" id="cropper-container3"></div>
                    <button type="button" id="uploadButton3" class="btn btn-md rounded sub-btn w-25 my-3">Upload</button>

                </div>
            </div>
            
        
const shop = async (req, res) => {
  try {
    log('in shop')
    const categories = await Category.aggregate([
      {
          $match: { isDeleted: false, islisted: true }
      },
      {
          $lookup: {
              from: 'products',
              localField: '_id',
              foreignField: 'category',
              as: 'products'
          }
      },
      {
        $addFields: {
            productCount: { $size: "$products" }
        }
      },
      {
          $project: {
              name: 1,
              slug: 1,
              productCount: 1
          }
      }
    ]);
       log('cat', categories)

   const page = parseInt(req.query.page) || 1;
   const limit = 6;  
    const categoryId = req.params.categoryId;
    const skip = (page - 1) * limit;

    log('id',categoryId)

    let products = [];
    let totalProducts = 0;
    let categoryName = '';
    
    if (categoryId) {
      const category = await Category.findOne({ _id: categoryId, islisted: true, isDeleted: false });
    log('categor',category);
      if (category) {
        categoryName = category.name;
      }
      log('categoryName',categoryName)

      totalProducts = await Product.countDocuments({
        category: categoryId,
        isBlocked: false,
        isDeleted: false
      });


      products = await Product.find({
        category: categoryId,
        isBlocked: false,
        isDeleted: false
      }).limit(limit)
      .skip(skip);
    } else {
      products = await Product.find({
        isBlocked: false,
        isDeleted: false
      }).limit(limit)
      .skip(skip);
    }

    const totalPages = Math.ceil(totalProducts / limit);

    res.render('users/shop', {
      title: 'shop - feather',
      categories,
      products,
      currentPage: page,
      totalPages,
      categoryName,
      // category
    });
  } catch (err) {
    console.error(err);
    res.redirect('/pageNotFound');
  }
};