import React from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

const HeroSlider = ({ posts }) => {
  return (
    <div className="w-full h-[400px] overflow-hidden rounded-lg shadow-lg">
      <Swiper
        modules={[Autoplay, Pagination]}
        slidesPerView={1}
        autoplay={{ delay: 4000 }}
        pagination={{ clickable: true }}
        className="h-full"
      >
        {posts.map((post) => (
          <SwiperSlide key={post.blog_id} className="relative">
            <img
              src={post.banner}
              alt={post.title}
              className="w-full h-full object-cover brightness-75"
            />
            <div className="absolute inset-0 flex flex-col justify-center items-center text-white text-center p-6">
              <h1 className="text-2xl font-bold">{post.title}</h1>
              <p className="mt-2 text-lg opacity-90">{post.authorId.personal_info.fullname}</p>
              <Link to={`/post/${post.blog_id}`} className="mt-4 px-6 py-2 bg-primary text-white rounded-lg">
                Read More
              </Link>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default HeroSlider;
