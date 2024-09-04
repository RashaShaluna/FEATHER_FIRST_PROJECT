<%- include('../layouts/homeheader') %>

<body>
	<div class="page-wrapper">
        <main class="main">
            <div class="page-header text-center" style="background-image: url('assets/images/page-header-bg.jpg')">
                <div class="container">
                    <h1 class="page-title" style="color: #d2ae1e;"><%= categoryName %></h1>
                </div><!-- End .container -->
            </div><!-- End .page-header -->

            
            <nav aria-label="breadcrumb" class="breadcrumb-nav mb-2">
                <div class="container">
                    <ol class="breadcrumb">
                        <li class="breadcrumb-item"><a href="/">Home</a></li>
                        <li class="breadcrumb-item"><a href="#"> <%= categoryName %> </a></li>
                    </ol>
                </div><!-- End .container -->
            </nav><!-- End .breadcrumb-nav -->


			<div class="page-content">
                <div class="container">
                    <div class="row">
                        <div class="col-lg-9">
                            <div class="products mb-3">
                                <div class="row justify-content-center">
                                    <% products.forEach(product => { %>
                                    <div class="col-6 col-md-4 col-lg-4">
                                        <div class="product product-7 text-center">
                                            <figure class="product-media">
                                                <a href="/product/<%= product._id %>">
                                                    <img src="/uploads/<%= product.images[0] %>" alt="Product image" class="product-image">
                                                </a>

                                                <div class="product-action-vertical">
                                                    <a href="#" class="btn-product-icon btn-wishlist btn-expandable"><span>Add to Wishlist</span></a>
                                                </div><!-- End .product-action-vertical -->

                                                <div class="product-action">
                                                    <a href="#" class="btn-product btn-cart"><span>Add to Cart</span></a>
                                                </div><!-- End .product-action -->
                                            </figure><!-- End .product-media -->

                                            <div class="product-body">
                                                <div class="product-cat">
                                                    <!-- Category Name or Filter Here -->
                                                </div><!-- End .product-cat -->
                                                <h3 class="product-title"><a href="/product/<%= product._id %>"><%= product.name %></a></h3><!-- End .product-title -->
                                                <div class="product-price">
                                                    <span class="new-price"><%= '₹' + product.offerprice %></span>
                                                    <span class="old-price"><%= '₹' + product.price %></span>
                                                </div><!-- End .product-price -->
                                            </div><!-- End .product-body -->
                                        </div><!-- End .product -->
                                    </div><!-- End .col-6 col-md-4 col-lg-4 -->
                                    <% }) %>
                                </div><!-- End .row -->
                            </div><!-- End .products -->

                            <nav aria-label="Page navigation">
                                <ul class="pagination justify-content-center">
                                    <li class="page-item disabled">
                                        <a class="page-link page-link-prev" href="#" aria-label="Previous" tabindex="-1" aria-disabled="true">
                                            <span aria-hidden="true"><i class="icon-long-arrow-left"></i></span>Prev
                                        </a>
                                    </li>
                                    <li class="page-item active" aria-current="page"><a class="page-link" href="#">1</a></li>
                                    <li class="page-item"><a class="page-link" href="#">2</a></li>
                                    <li class="page-item"><a class="page-link" href="#">3</a></li>
                                    <li class="page-item-total">of 6</li>
                                    <li class="page-item">
                                        <a class="page-link page-link-next" href="#" aria-label="Next">
                                            Next <span aria-hidden="true"><i class="icon-long-arrow-right"></i></span>
                                        </a>
                                    </li>
                                </ul>
                            </nav>
                        </div><!-- End .col-lg-9 -->
                		<aside class="col-lg-3 order-lg-first">
                			<div class="sidebar sidebar-shop">
                				<div class="widget widget-clean">
                					<label>Filters:</label>
                					<a href="#" class="sidebar-filter-clear">Clean All</a>
                				</div><!-- End .widget widget-clean -->

                				<div class="widget widget-collapsible">
    								<h3 class="widget-title">
									    <a data-toggle="collapse" href="#widget-1" role="button" aria-expanded="true" aria-controls="widget-1">
									        Category
									    </a>
									</h3><!-- End .widget-title -->

									<div class="collapse show" id="widget-1">
										<div class="widget-body">
											<div class="filter-items filter-items-count">
												<div class="filter-item">
													<div class="custom-control custom-checkbox">
														<input type="checkbox" class="custom-control-input" id="cat-1">
														<label class="custom-control-label" for="cat-1">Dresses</label>
													</div><!-- End .custom-checkbox -->
													<span class="item-count">3</span>
												</div><!-- End .filter-item -->
										</div><!-- End .widget-body -->
									</div><!-- End .collapse -->
        						</div><!-- End .widget -->

        						

									
        						<div class="widget widget-collapsible">
    								<h3 class="widget-title">
									    <a data-toggle="collapse" href="#widget-3" role="button" aria-expanded="true" aria-controls="widget-3">
									        Colour
									    </a>
									</h3><!-- End .widget-title -->

									<div class="collapse show" id="widget-3">
										<div class="widget-body">
											<div class="filter-colors">
												<a href="#" style="background: #b87145;"><span class="sr-only">Color Name</span></a>
												
											</div><!-- End .filter-colors -->
										</div><!-- End .widget-body -->
									</div><!-- End .collapse -->
        						</div><!-- End .widget -->

        					
        						</div><!-- End .widget -->

        						<div class="widget widget-collapsible">
    								<h3 class="widget-title">
									    <a data-toggle="collapse" href="#widget-5" role="button" aria-expanded="true" aria-controls="widget-5">
									        Price
									    </a>
									</h3><!-- End .widget-title -->

									<div class="collapse show" id="widget-5">
										<div class="widget-body">
                                            <div class="filter-price">
                                                <div class="filter-price-text">
                                                    Price Range:
                                                    <span id="filter-price-range"></span>
                                                </div><!-- End .filter-price-text -->

                                                <div id="price-slider"></div><!-- End #price-slider -->
                                            </div><!-- End .filter-price -->
										</div><!-- End .widget-body -->
									</div><!-- End .collapse -->
        						</div><!-- End .widget -->
                			</div><!-- End .sidebar sidebar-shop -->
                		</aside><!-- End .col-lg-3 -->
                	</div><!-- End .row -->
                </div><!-- End .container -->
            </div><!-- End .page-content -->
        </main><!-- End .main -->
        </div>
    </body>
        <%- include('../layouts/homefooter') %>
        <%- include('../layouts/homeheader') %>

        <body>
            <div class="page-wrapper">
                <main class="main">
                    <div class="page-header text-center" style="background-image: url('assets/images/page-header-bg.jpg')">
                        <div class="container">
                            <h1 class="page-title" style="color: #d2ae1e;"><%= categoryName %></h1>
                        </div><!-- End .container -->
                    </div><!-- End .page-header -->
        
                    
                    <nav aria-label="breadcrumb" class="breadcrumb-nav mb-2">
                        <div class="container">
                            <ol class="breadcrumb">
                                <li class="breadcrumb-item"><a href="/">Home</a></li>
                                <li class="breadcrumb-item"><a href="#"> <%= categoryName %> </a></li>
                            </ol>
                        </div><!-- End .container -->
                    </nav><!-- End .breadcrumb-nav -->
        
        
                    <div class="page-content">
                        <div class="container">
                            <div class="row">
                                <div class="col-lg-9">
                                    <div class="products mb-3">
                                        <div class="row justify-content-center">
                                            <% products.forEach(product => { %>
                                            <div class="col-6 col-md-4 col-lg-4">
                                                <div class="product product-7 text-center">
                                                    <figure class="product-media">
                                                        <a href="/product/<%= product._id %>">
                                                            <img src="/uploads/<%= product.images[0] %>" alt="Product image" class="product-image">
                                                        </a>
        
                                                        <div class="product-action-vertical">
                                                            <a href="#" class="btn-product-icon btn-wishlist btn-expandable"><span>Add to Wishlist</span></a>
                                                        </div><!-- End .product-action-vertical -->
        
                                                        <div class="product-action">
                                                            <a href="#" class="btn-product btn-cart"><span>Add to Cart</span></a>
                                                        </div><!-- End .product-action -->
                                                    </figure><!-- End .product-media -->
        
                                                    <div class="product-body">
                                                        <div class="product-cat">
                                                            <!-- Category Name or Filter Here -->
                                                        </div><!-- End .product-cat -->
                                                        <h3 class="product-title"><a href="/product/<%= product._id %>"><%= product.name %></a></h3><!-- End .product-title -->
                                                        <div class="product-price">
                                                            <span class="new-price"><%= '₹' + product.offerprice %></span>
                                                            <span class="old-price"><%= '₹' + product.price %></span>
                                                        </div><!-- End .product-price -->
                                                    </div><!-- End .product-body -->
                                                </div><!-- End .product -->
                                            </div><!-- End .col-6 col-md-4 col-lg-4 -->
                                            <% }) %>
                                        </div><!-- End .row -->
                                    </div><!-- End .products -->
        
                                    <nav aria-label="Page navigation">
                                        <ul class="pagination justify-content-center">
                                            <li class="page-item disabled">
                                                <a class="page-link page-link-prev" href="#" aria-label="Previous" tabindex="-1" aria-disabled="true">
                                                    <span aria-hidden="true"><i class="icon-long-arrow-left"></i></span>Prev
                                                </a>
                                            </li>
                                            <li class="page-item active" aria-current="page"><a class="page-link" href="#">1</a></li>
                                            <li class="page-item"><a class="page-link" href="#">2</a></li>
                                            <li class="page-item"><a class="page-link" href="#">3</a></li>
                                            <li class="page-item-total">of 6</li>
                                            <li class="page-item">
                                                <a class="page-link page-link-next" href="#" aria-label="Next">
                                                    Next <span aria-hidden="true"><i class="icon-long-arrow-right"></i></span>
                                                </a>
                                            </li>
                                        </ul>
                                    </nav>
                                </div><!-- End .col-lg-9 -->
                                <aside class="col-lg-3 order-lg-first">
                                    <div class="sidebar sidebar-shop">
                                        <div class="widget widget-clean">
                                            <label>Filters:</label>
                                            <a href="#" class="sidebar-filter-clear">Clean All</a>
                                        </div><!-- End .widget widget-clean -->
        
                                        <div class="widget widget-collapsible">
                                            <h3 class="widget-title">
                                                <a data-toggle="collapse" href="#widget-1" role="button" aria-expanded="true" aria-controls="widget-1">
                                                    Category
                                                </a>
                                            </h3><!-- End .widget-title -->
        
                                            <div class="collapse show" id="widget-1">
                                                <div class="widget-body">
                                                    <div class="filter-items filter-items-count">
                                                        <div class="filter-item">
                                                            <div class="custom-control custom-checkbox">
                                                                <input type="checkbox" class="custom-control-input" id="cat-1">
                                                                <label class="custom-control-label" for="cat-1">Dresses</label>
                                                            </div><!-- End .custom-checkbox -->
                                                            <span class="item-count">3</span>
                                                        </div><!-- End .filter-item -->
                                                </div><!-- End .widget-body -->
                                            </div><!-- End .collapse -->
                                        </div><!-- End .widget -->
        
                                        
        
                                            
                                        <div class="widget widget-collapsible">
                                            <h3 class="widget-title">
                                                <a data-toggle="collapse" href="#widget-3" role="button" aria-expanded="true" aria-controls="widget-3">
                                                    Colour
                                                </a>
                                            </h3><!-- End .widget-title -->
        
                                            <div class="collapse show" id="widget-3">
                                                <div class="widget-body">
                                                    <div class="filter-colors">
                                                        <a href="#" style="background: #b87145;"><span class="sr-only">Color Name</span></a>
                                                        
                                                    </div><!-- End .filter-colors -->
                                                </div><!-- End .widget-body -->
                                            </div><!-- End .collapse -->
                                        </div><!-- End .widget -->
        
                                    
                                        </div><!-- End .widget -->
        
                                        <div class="widget widget-collapsible">
                                            <h3 class="widget-title">
                                                <a data-toggle="collapse" href="#widget-5" role="button" aria-expanded="true" aria-controls="widget-5">
                                                    Price
                                                </a>
                                            </h3><!-- End .widget-title -->
        
                                            <div class="collapse show" id="widget-5">
                                                <div class="widget-body">
                                                    <div class="filter-price">
                                                        <div class="filter-price-text">
                                                            Price Range:
                                                            <span id="filter-price-range"></span>
                                                        </div><!-- End .filter-price-text -->
        
                                                        <div id="price-slider"></div><!-- End #price-slider -->
                                                    </div><!-- End .filter-price -->
                                                </div><!-- End .widget-body -->
                                            </div><!-- End .collapse -->
                                        </div><!-- End .widget -->
                                    </div><!-- End .sidebar sidebar-shop -->
                                </aside><!-- End .col-lg-3 -->
                            </div><!-- End .row -->
                        </div><!-- End .container -->
                    </div><!-- End .page-content -->
                </main><!-- End .main -->
                </div>
            </body>
                <%- include('../layouts/homefooter') %>
        