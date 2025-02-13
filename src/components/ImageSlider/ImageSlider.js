import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import './ImageSliderStyles.css';
import Header from '../../components/Header/Header';
const ImageSlider = ({ startFullScreen = false, initialImage = null }) => {
    const trackRef = useRef(null);
    const scrollbarRef = useRef(null);
    const [isScrollVisible, setIsScrollVisible] = useState(true);
    const [isFullScreen, setIsFullScreen] = useState(startFullScreen);
    const [selectedImage, setSelectedImage] = useState(initialImage);
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [opacityDelayed, setOpacityDelayed] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [isDraggingScrollbar, setIsDraggingScrollbar] = useState(false);
    const scrollbarThumbRef = useRef(null);
    const [isExiting, setIsExiting] = useState(false);
    const imageRefs = useRef([]);
    const [showBackButton, setShowBackButton] = useState(true);
    const fullscreenRef = useRef(null);
    // need to make it so u only go fullscreen after intro, not when switching from about to projects
    const [imageTransitionState, setImageTransitionState] = useState({
        rect: startFullScreen ? {
            top: 0,
            left: 0,
            width: window.innerWidth,
            height: window.innerHeight
        } : null,
        objectPosition: '100% center',
        scale: 1
    });
    const handleFullscreenScroll = (e) => {
        const scrollTop = e.target.scrollTop;
        setShowBackButton(scrollTop === 0);
    };

    useEffect(() => {
        if (isFullScreen && fullscreenRef.current) {
            fullscreenRef.current.scrollTo(0, 0);
            setShowBackButton(true);
        }
    }, [selectedImage, isFullScreen]);
    const [sliderState, setSliderState] = useState({
        mouseDownAt: 0,
        prevPercentage: 0,
        percentage: 0
    });
    const navigate = (direction) => {
        const newPercentage = sliderState.percentage + (direction === 'left' ? 10 : -10);
        const clamped = Math.max(Math.min(newPercentage, 0), -90);
        
        setSliderState(prev => ({
            ...prev,
            percentage: clamped,
            prevPercentage: clamped
        }));
        updateTrackPosition(clamped);
    };
    useEffect(() => {
        if (!isFullScreen) {
            const timer = setTimeout(() => {
                setOpacityDelayed(false);
            }, 1000);
            return () => clearTimeout(timer);
        } else {
            setOpacityDelayed(true);
        }
    }, [isFullScreen]);

    const updateTrackPosition = (percentage) => {
        const track = trackRef.current;
        if (!track) return;

        track.animate(
            {
                transform: `translate(${percentage}%, -50%)`
            },
            { 
                duration: 600, 
                fill: 'forwards',
                easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)' 
            }
        );

        const images = track.getElementsByClassName("image");
        Array.from(images).forEach((image) => {
            image.animate(
                {
                    objectPosition: `${100 + percentage * 1.1}% center`
                },
                { 
                    duration: 600, 
                    fill: 'forwards',
                    easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)'
                }
            );
        });
    };
    useEffect(() => {
        setTimeout(() => {
            if (imageRefs.current[0]) {
                // Trigger click on the first image after a slight delay
                imageRefs.current[0].click();
            }
        }, -200); // Adjust the delay as needed
    }, []);
    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;

        const handleOnDown = (e) => {
            if (isFullScreen || isDraggingScrollbar) return;
            
            const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
            setSliderState(prev => ({
                ...prev,
                mouseDownAt: clientX
            }));
            setIsDragging(false);
        };

        const handleOnUp = () => {
            if (isFullScreen || isDraggingScrollbar) return;
            
            setSliderState(prev => ({
                ...prev,
                mouseDownAt: 0,
                prevPercentage: prev.percentage
            }));
        };

        const handleOnMove = (e) => {
            if (isFullScreen || isDraggingScrollbar) return;
            
            const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
            
            if (sliderState.mouseDownAt === 0) return;
            setIsDragging(true);

            const mouseDelta = sliderState.mouseDownAt - clientX;
            const maxDelta = window.innerWidth / 0.8;

            const percentage = (mouseDelta / maxDelta) * -100;
            const nextPercentageUnconstrained = sliderState.prevPercentage + percentage;
            const nextPercentage = Math.max(Math.min(nextPercentageUnconstrained, 0), -90);

            setSliderState(prev => ({
                ...prev,
                percentage: nextPercentage
            }));

            updateTrackPosition(nextPercentage);
        };

        window.addEventListener('mousedown', handleOnDown);
        window.addEventListener('mousemove', handleOnMove);
        window.addEventListener('mouseup', handleOnUp);
        
        window.addEventListener('touchstart', handleOnDown);
        window.addEventListener('touchmove', handleOnMove);
        window.addEventListener('touchend', handleOnUp);

        return () => {
            window.removeEventListener('mousedown', handleOnDown);
            window.removeEventListener('mousemove', handleOnMove);
            window.removeEventListener('mouseup', handleOnUp);
            
            window.removeEventListener('touchstart', handleOnDown);
            window.removeEventListener('touchmove', handleOnMove);
            window.removeEventListener('touchend', handleOnUp);
        };
    }, [isFullScreen, sliderState, isDraggingScrollbar]);

    const handleScrollbarMouseDown = (e) => {
        if (isFullScreen) return;
        
        setIsDraggingScrollbar(true);
        const scrollbar = scrollbarRef.current;
        const thumb = scrollbarThumbRef.current;
        
        if (!scrollbar || !thumb) return;

        const scrollbarRect = scrollbar.getBoundingClientRect();
        const clickPosition = (e.clientX - scrollbarRect.left) / scrollbarRect.width;
        const percentage = Math.max(Math.min(clickPosition * -100, 0), -90);

        setSliderState(prev => ({
            ...prev,
            percentage: percentage,
            prevPercentage: percentage
        }));

        updateTrackPosition(percentage);
    };

    const handleScrollbarMouseMove = (e) => {
        if (!isDraggingScrollbar || isFullScreen) return;

        const scrollbar = scrollbarRef.current;
        if (!scrollbar) return;

        const scrollbarRect = scrollbar.getBoundingClientRect();
        const position = (e.clientX - scrollbarRect.left) / scrollbarRect.width;
        const percentage = Math.max(Math.min(position * -100, 0), -90);

        setSliderState(prev => ({
            ...prev,
            percentage: percentage,
            prevPercentage: percentage
        }));

        updateTrackPosition(percentage);
    };

    const handleScrollbarMouseUp = () => {
        setIsDraggingScrollbar(false);
    };

    useEffect(() => {
        window.addEventListener('mousemove', handleScrollbarMouseMove);
        window.addEventListener('mouseup', handleScrollbarMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleScrollbarMouseMove);
            window.removeEventListener('mouseup', handleScrollbarMouseUp);
        };
    }, [isDraggingScrollbar]);

    const handleImageClick = (e, src, index) => {
        if (isDragging) return;
        
        // // If already in full screen and clicking the same image, close it
        // if (isFullScreen && selectedImage === src) {
        //     setIsTextExpanded(!isTextExpanded);
        //     handleFullScreenClose();
        //     return;
        // }
        setIsScrollVisible(true);
        const imgElement = e.target;
        const rect = imgElement.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(imgElement);
        const objectPosition = computedStyle.objectPosition;
    
        // Set image transition state immediately
        setImageTransitionState({
            rect: {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height
            },
            objectPosition,
            scale: 1
        });
    
        // Set full screen state
        setSelectedImage(src);
        setSelectedIndex(index);
        setIsFullScreen(true);
    };

    const handleFullScreenClose = () => {
        setIsScrollVisible(false)
        setIsFullScreen(false);
        setSelectedImage(null);
        setImageTransitionState(prev => ({
            ...prev,
            rect: null
        }));
    };

    const images = Array.from({ length: 7 }, (_, index) => `/images/${index + 1}.jpg`);

    return (
        <LayoutGroup>
            <Header />
            {isFullScreen && (
                <motion.div
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 100, opacity: 0 }}
                    className="back-text"
                    onClick={handleFullScreenClose}
                >
                    Back
                </motion.div>
            )}
            <div 
                id="image-track" 
                ref={trackRef} 
                style={{ 
                    transform: `translate(${sliderState.percentage}%, -50%)`,
                    opacity: isFullScreen ? 0 : 1,
                    transition: 'opacity 0.4s ease-in-out'
                }}
            >
                {images.map((src, index) => (
                    <motion.img
                        layoutId={`image-${index}`}
                        key={src}
                        className="image"
                        src={src}
                        alt={`Image ${index + 1}`}
                        draggable="false"
                        onClick={(e) => handleImageClick(e, src, index)}
                        whileHover={{ scale: 1.05 }}
                        style={{
                            cursor: 'pointer',
                            willChange: 'transform'
                        }}
                        ref={(el) => (imageRefs.current[index] = el)}
                    />
                ))}
            </div>

            <div 
                className="image-scrollbar" 
                ref={scrollbarRef}
                onMouseDown={handleScrollbarMouseDown}
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '50%',
                    height: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    cursor: 'pointer',
                    borderRadius: '2px',
                    opacity: isFullScreen ? 0 : 1,
                    transition: 'opacity 0.4s ease-in-out'
                }}
            >
                <div
                    ref={scrollbarThumbRef}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: `${Math.abs(sliderState.percentage)}%`,
                        width: '10%',
                        height: '100%',
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        borderRadius: '2px',
                        cursor: 'pointer'
                    }}
                />
            </div>

            <AnimatePresence>
                {isFullScreen && imageTransitionState.rect && (
                    <motion.div
                        ref={fullscreenRef}
                        initial={{
                            position: 'fixed',
                            top: imageTransitionState.rect.top,
                            left: imageTransitionState.rect.left,
                            width: imageTransitionState.rect.width,
                            height: imageTransitionState.rect.height,
                            scale: imageTransitionState.scale,
                            backgroundColor: 'black',
                            zIndex: 1000,
                            overflow: 'hidden'
                        }}
                        animate={{
                            top: 0,
                            left: 0,
                            width: '100vw',
                            height: '100vh',
                            scale: 1,
                            overflowY: isScrollVisible ? 'auto' : 'hidden'
                        }}
                        exit={{
                            top: imageTransitionState.rect.top,
                            left: imageTransitionState.rect.left,
                            width: imageTransitionState.rect.width,
                            height: imageTransitionState.rect.height,
                            scale: imageTransitionState.scale,
                            overflow: 'hidden'
                        }}
                        transition={{
                            duration: 0.4,
                            ease: "easeInOut"
                        }}
                        className="custom-scrollbar"
                        onScroll={handleFullscreenScroll}
                    >
                        <motion.div isFullScreen={true}
                            initial={{ y: -50, opacity: 0 }} // Animation to bring header from above
                            animate={{ y: 0, opacity: 1 }}   // Set final position
                            exit={{ y: -50, opacity: 0 }}    // Exit animation
                            transition={{ duration: 0 }}
                            style={{ 
                                position: 'absolute', 
                                top: 0, 
                                left: 0, 
                                right: 0, 
                                zIndex: 1, 
                                '--text-outline-color': 'black'  // Define the custom CSS property
                              }}
                        >
                            <Header isFullScreen={true}/>
                        </motion.div>
                                                    
                        <AnimatePresence>
                            {showBackButton && ( // back doesnt dissapear
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className="back-text"
                                    onClick={handleFullScreenClose}
                                >
                                    Back
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.img
                            src={selectedImage}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                objectPosition: imageTransitionState.objectPosition,
                                transform: `scale(${imageTransitionState.scale})`,
                                transformOrigin: 'center center',
                                pointerEvents: 'none'
                                
                            }}
                            alt="Full screen view"
                        />
                         <div className="text-content">
                            <h2>About This Image</h2>
                            <p>
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                                Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                                {/* Add more content to enable scrolling */}
                                {Array(20).fill().map((_, i) => (
                                    <React.Fragment key={i}>
                                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                                        Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.<br />
                                    </React.Fragment>
                                ))}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </LayoutGroup>
    );
};

export default ImageSlider;