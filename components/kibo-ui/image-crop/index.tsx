"use client";

import { CropIcon, RotateCcwIcon } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";
import {
  type ComponentProps,
  type CSSProperties,
  createContext,
  type MouseEvent,
  type ReactNode,
  type RefObject,
  type SyntheticEvent,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type PercentCrop,
  type PixelCrop,
  type ReactCropProps,
} from "react-image-crop";
import { cn } from "@/lib/utils";

import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";

const centerAspectCrop = (
  mediaWidth: number,
  mediaHeight: number,
  aspect: number | undefined
): PercentCrop =>
  centerCrop(
    aspect
      ? makeAspectCrop(
          {
            unit: "%",
            width: 90,
          },
          aspect,
          mediaWidth,
          mediaHeight
        )
      : { x: 0, y: 0, width: 90, height: 90, unit: "%" },
    mediaWidth,
    mediaHeight
  );

const getCroppedPngImage = async (
  imageSrc: HTMLImageElement,
  scaleFactor: number,
  pixelCrop: PixelCrop,
  maxImageSize: number
): Promise<string> => {
  console.log("[ImageCrop] getCroppedPngImage start", {
    scaleFactor,
    pixelCrop,
    naturalWidth: imageSrc.naturalWidth,
    naturalHeight: imageSrc.naturalHeight,
    displayedWidth: imageSrc.width,
    displayedHeight: imageSrc.height,
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Context is null, this should never happen.");
  }

  // scaleX/Y convert from displayed image to natural pixels
  const scaleX = imageSrc.naturalWidth / imageSrc.width;
  const scaleY = imageSrc.naturalHeight / imageSrc.height;

  // destination size (scale up for quality)
  const destWidth = Math.max(1, Math.round(pixelCrop.width * scaleFactor));
  const destHeight = Math.max(1, Math.round(pixelCrop.height * scaleFactor));

  canvas.width = destWidth;
  canvas.height = destHeight;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // source rectangle in the image's natural pixels
  const sx = Math.round(pixelCrop.x * scaleX);
  const sy = Math.round(pixelCrop.y * scaleY);
  const sWidth = Math.round(pixelCrop.width * scaleX);
  const sHeight = Math.round(pixelCrop.height * scaleY);

  // draw the extracted area scaled up to dest size to improve quality
  ctx.drawImage(imageSrc, sx, sy, sWidth, sHeight, 0, 0, destWidth, destHeight);

  const croppedImageUrl = canvas.toDataURL("image/png");
  const response = await fetch(croppedImageUrl);
  const blob = await response.blob();

  console.log("[ImageCrop] getCroppedPngImage result", {
    destWidth,
    destHeight,
    blobSize: blob.size,
    approxBase64Length: croppedImageUrl.length,
  });

  if (blob.size > maxImageSize) {
    console.warn(
      "[ImageCrop] blob exceeds maxImageSize, retrying with lower scale",
      {
        blobSize: blob.size,
        maxImageSize,
        scaleFactor,
      }
    );
    // reduce scale and try again
    return await getCroppedPngImage(
      imageSrc,
      Math.max(0.5, scaleFactor * 0.85),
      pixelCrop,
      maxImageSize
    );
  }

  return croppedImageUrl;
};

type ImageCropContextType = {
  file: File;
  maxImageSize: number;
  imgSrc: string;
  crop: PercentCrop | undefined;
  completedCrop: PixelCrop | null;
  imgRef: RefObject<HTMLImageElement | null>;
  onCrop?: (croppedImage: string) => void;
  reactCropProps: Omit<ReactCropProps, "onChange" | "onComplete" | "children">;
  handleChange: (pixelCrop: PixelCrop, percentCrop: PercentCrop) => void;
  handleComplete: (
    pixelCrop: PixelCrop,
    percentCrop: PercentCrop
  ) => Promise<void>;
  onImageLoad: (e: SyntheticEvent<HTMLImageElement>) => void;
  applyCrop: () => Promise<void>;
  resetCrop: () => void;
};

const ImageCropContext = createContext<ImageCropContextType | null>(null);

const useImageCrop = () => {
  const context = useContext(ImageCropContext);
  if (!context) {
    // Return a safe noop context to avoid runtime crashes when a consumer is rendered
    // outside of the provider (e.g. during HMR / dev refresh). Consumers will be no-op.
    const defaultContext: ImageCropContextType = {
      file: typeof File !== "undefined" ? new File([], "noop") : ({} as File),
      maxImageSize: 0,
      imgSrc: "",
      crop: undefined,
      completedCrop: null,
      imgRef: { current: null },
      onCrop: undefined,
      reactCropProps: {} as any,
      handleChange: () => {},
      handleComplete: async () => {},
      onImageLoad: () => {},
      applyCrop: async () => {},
      resetCrop: () => {},
    };
    return defaultContext;
  }
  return context;
};

export type ImageCropProps = {
  file: File;
  maxImageSize?: number;
  onCrop?: (croppedImage: string) => void;
  children: ReactNode;
  onChange?: ReactCropProps["onChange"];
  onComplete?: ReactCropProps["onComplete"];
} & Omit<ReactCropProps, "onChange" | "onComplete" | "children">;

export const ImageCrop = ({
  file,
  maxImageSize = 1024 * 1024 * 5,
  onCrop,
  children,
  onChange,
  onComplete,
  ...reactCropProps
}: ImageCropProps) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgSrc, setImgSrc] = useState<string>("");
  const [crop, setCrop] = useState<PercentCrop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [initialCrop, setInitialCrop] = useState<PercentCrop>();

  useEffect(() => {
    const reader = new FileReader();
    reader.addEventListener("load", () =>
      setImgSrc(reader.result?.toString() || "")
    );
    reader.readAsDataURL(file);
  }, [file]);

  const onImageLoad = useCallback(
    (e: SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      const newCrop = centerAspectCrop(width, height, reactCropProps.aspect);
      console.log("[ImageCrop] onImageLoad", {
        displayedWidth: width,
        displayedHeight: height,
        aspect: reactCropProps.aspect,
        initialCrop: newCrop,
      });
      setCrop(newCrop);
      setInitialCrop(newCrop);
    },
    [reactCropProps.aspect]
  );

  // Helper: convert percent crop -> pixel crop using displayed image dims
  const percentToPixel = (p: PercentCrop): PixelCrop => {
    const imgEl = imgRef.current as HTMLImageElement | null;
    const displayedW = imgEl?.width || 1;
    const displayedH = imgEl?.height || 1;
    const pixel = {
      x: Math.round(((p.x ?? 0) * displayedW) / 100),
      y: Math.round(((p.y ?? 0) * displayedH) / 100),
      width: Math.round(((p.width ?? 0) * displayedW) / 100),
      height: Math.round(((p.height ?? 0) * displayedH) / 100),
      unit: "px" as const, // fix: ensure literal type
    };
    console.log("[ImageCrop] percentToPixel", {
      percent: p,
      displayedW,
      displayedH,
      pixel,
    });
    return pixel;
  };

  // Robust handleChange: accept either (pixelCrop, percentCrop) OR (percentCrop)
  const handleChange = (arg1: any, arg2?: any) => {
    let pixelCrop: PixelCrop;
    let percentCrop: PercentCrop;

    if (arg2) {
      // signature: (pixelCrop, percentCrop)
      pixelCrop = arg1 as PixelCrop;
      percentCrop = arg2 as PercentCrop;
      console.log("[ImageCrop] handleChange called (pixel, percent)", {
        pixelCrop,
        percentCrop,
      });
    } else {
      // signature: (percentCrop)
      percentCrop = arg1 as PercentCrop;
      pixelCrop = percentToPixel(percentCrop);
      console.log("[ImageCrop] handleChange called (percent)", {
        percentCrop,
        pixelCrop,
      });
    }

    setCrop(percentCrop);
    onChange?.(pixelCrop, percentCrop);
  };

  // Robust handleComplete: accept either (pixelCrop, percentCrop) OR (percentCrop)
  const handleComplete = async (arg1: any, arg2?: any) => {
    let pixelCrop: PixelCrop;
    let percentCrop: PercentCrop;

    if (arg2) {
      // signature: (pixelCrop, percentCrop)
      pixelCrop = arg1 as PixelCrop;
      percentCrop = arg2 as PercentCrop;
      console.log("[ImageCrop] handleComplete called (pixel, percent)", {
        pixelCrop,
        percentCrop,
      });
    } else {
      // signature: (percentCrop)
      percentCrop = arg1 as PercentCrop;
      pixelCrop = percentToPixel(percentCrop);
      console.log("[ImageCrop] handleComplete called (percent)", {
        percentCrop,
        pixelCrop,
      });
    }

    setCompletedCrop(pixelCrop);
    await onComplete?.(pixelCrop, percentCrop);
  };

  const applyCrop = async () => {
    console.log("[ImageCrop] applyCrop start", { completedCrop });
    if (!(imgRef.current && completedCrop)) {
      console.warn(
        "[ImageCrop] applyCrop aborted: missing imgRef or completedCrop",
        { imgRef: !!imgRef.current, completedCrop }
      );
      return;
    }

    // Compute a scale factor for better output quality:
    const deviceDpr =
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const completedWidth = Math.max(1, completedCrop.width);
    const upscaleTarget = 1920;
    let targetScale = Math.min(2, upscaleTarget / completedWidth);
    targetScale = Math.max(1, targetScale);
    const scaleFactor = Math.max(deviceDpr, Math.min(targetScale, 3));

    console.log("[ImageCrop] applyCrop scaleFactor", {
      deviceDpr,
      completedWidth,
      scaleFactor,
    });

    const croppedImage = await getCroppedPngImage(
      imgRef.current,
      scaleFactor,
      completedCrop,
      maxImageSize
    );

    console.log("[ImageCrop] applyCrop produced base64 length", {
      length: croppedImage.length,
    });
    onCrop?.(croppedImage);
  };

  const resetCrop = () => {
    console.log("[ImageCrop] resetCrop", { initialCrop });
    if (initialCrop) {
      setCrop(initialCrop);
      setCompletedCrop(null);
    } else {
      console.warn("[ImageCrop] resetCrop called but no initialCrop available");
    }
  };

  const contextValue: ImageCropContextType = {
    file,
    maxImageSize,
    imgSrc,
    crop,
    completedCrop,
    imgRef,
    onCrop,
    reactCropProps,
    handleChange,
    handleComplete,
    onImageLoad,
    applyCrop,
    resetCrop,
  };

  return (
    <ImageCropContext.Provider value={contextValue}>
      {children}
    </ImageCropContext.Provider>
  );
};

export type ImageCropContentProps = {
  style?: CSSProperties;
  className?: string;
};

export const ImageCropContent = ({
  style,
  className,
}: ImageCropContentProps) => {
  const {
    imgSrc,
    crop,
    handleChange,
    handleComplete,
    onImageLoad,
    imgRef,
    reactCropProps,
  } = useImageCrop();

  // Responsive container: base constraints from viewport with caps
  const [viewport, setViewport] = useState({ w: 1200, h: 800 });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () =>
      setViewport({
        w: window.innerWidth,
        h: window.innerHeight,
      });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // base maxima (feel free to tweak)
  const maxAllowedWidth = Math.min(1420, Math.round(viewport.w * 0.9));
  const maxAllowedHeight = Math.min(1080, Math.round(viewport.h * 0.72));

  // derive final pixel width/height to fit aspect ratio without overflow
  const aspect =
    typeof reactCropProps.aspect === "number"
      ? reactCropProps.aspect
      : undefined;
  let finalWidth = maxAllowedWidth;
  let finalHeight = Math.round(finalWidth / (aspect || 16 / 9));

  if (finalHeight > maxAllowedHeight) {
    finalHeight = maxAllowedHeight;
    finalWidth = Math.round(finalHeight * (aspect || 16 / 9));
  }

  // Ensure integers and at least minimal size
  finalWidth = Math.max(200, Math.round(finalWidth));
  finalHeight = Math.max(150, Math.round(finalHeight));

  // Use CSS aspect-ratio + maxWidth so container shrinks on small viewports and keeps aspect
  const wrapperStyle: CSSProperties = {
    width: "100%",
    maxWidth: finalWidth,
    aspectRatio: aspect ? String(aspect) : undefined,
    // allow consumers to override / add padding
    ...style,
  };

  const shadcnStyle = {
    "--rc-border-color": "var(--color-border)",
    "--rc-focus-color": "var(--color-primary)",
  } as CSSProperties;

  return (
    // outer container centers the crop UI
    <div
      className={cn(
        "w-full flex flex-col items-center justify-center overflow-hidden",
        className
      )}
      style={{ padding: 8 }}
    >
      <div style={wrapperStyle} className="w-full bg-transparent">
        <ReactCrop
          className="w-full h-full"
          crop={crop}
          onChange={handleChange}
          onComplete={handleComplete}
          // let ReactCrop fill the wrapper
          style={{ ...shadcnStyle, width: "100%", height: "100%" }}
          {...reactCropProps}
        >
          {imgSrc && (
            <img
              alt="crop"
              className="block"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "block",
                margin: "0 auto",
              }}
              onLoad={onImageLoad}
              ref={imgRef}
              src={imgSrc}
            />
          )}
        </ReactCrop>
      </div>
    </div>
  );
};

export type ImageCropApplyProps = ComponentProps<"button"> & {
  asChild?: boolean;
};

export const ImageCropApply = ({
  asChild = false,
  children,
  onClick,
  ...props
}: ImageCropApplyProps) => {
  const { applyCrop, completedCrop } = useImageCrop();

  const handleClick = async (e: MouseEvent<HTMLButtonElement>) => {
    console.log(
      "[ImageCropApply] clicked, completedCrop available:",
      !!completedCrop
    );
    await applyCrop();
    onClick?.(e);
  };

  // When used as a child, forward props and onClick to Slot so consumer elements receive them
  if (asChild) {
    return (
      <Slot {...(props as any)} onClick={handleClick}>
        {children}
      </Slot>
    );
  }

  return (
    // make explicit type and disable until we have a completedCrop to avoid silent no-ops
    <Button
      type="button"
      onClick={handleClick}
      size="sm"
      variant="default"
      disabled={(props as any).disabled || !completedCrop}
      {...props}
    >
      Crop Image
    </Button>
  );
};

export type ImageCropResetProps = ComponentProps<"button"> & {
  asChild?: boolean;
};

export const ImageCropReset = ({
  asChild = false,
  children,
  onClick,
  ...props
}: ImageCropResetProps) => {
  const { resetCrop, completedCrop } = useImageCrop();

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    resetCrop();
    onClick?.(e);
  };

  if (asChild) {
    return (
      <Slot {...(props as any)} onClick={handleClick}>
        {children}
      </Slot>
    );
  }

  return (
    <Button
      type="button"
      onClick={handleClick}
      size="sm"
      variant="outline"
      disabled={(props as any).disabled || !completedCrop}
      {...props}
    >
      Reset Crop
    </Button>
  );
};

// Keep the original Cropper component for backward compatibility
export type CropperProps = Omit<ReactCropProps, "onChange"> & {
  file: File;
  maxImageSize?: number;
  onCrop?: (croppedImage: string) => void;
  onChange?: ReactCropProps["onChange"];
};

export const Cropper = ({
  onChange,
  onComplete,
  onCrop,
  style,
  className,
  file,
  maxImageSize,
  ...props
}: CropperProps) => (
  <ImageCrop
    file={file}
    maxImageSize={maxImageSize}
    onChange={onChange}
    onComplete={onComplete}
    onCrop={onCrop}
    {...props}
  >
    <ImageCropContent className={className} style={style} />
  </ImageCrop>
);
