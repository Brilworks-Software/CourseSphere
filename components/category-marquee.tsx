"use client";

import { motion, useAnimation } from "framer-motion";
import Link from "next/link";
import { useEffect } from "react";
import { COURSE_CATEGORIES_WITH_ICONS } from "@/app/util/course_category";

export function CategoryMarquee() {
  // Get all subcategories from all categories
  const allSubcategories = COURSE_CATEGORIES_WITH_ICONS.flatMap((cat) =>
    (cat.children || []).map((sub) => ({
      ...sub,
      parentLabel: cat.label,
      parentValue: cat.value,
      parentIcon: cat.icon,
    }))
  );

  // Split subcategories into 4 rows (2 above, 2 below main categories)
  const rowSize = Math.ceil(allSubcategories.length / 4);
  const row1 = allSubcategories.slice(0, rowSize);
  const row2 = allSubcategories.slice(rowSize, rowSize * 2);
  const row4 = allSubcategories.slice(rowSize * 2, rowSize * 3);
  const row5 = allSubcategories.slice(rowSize * 3);

  // Main categories for center row
  const mainCategories = COURSE_CATEGORIES_WITH_ICONS;

  return (
    <section className="py-24 bg-background overflow-hidden relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-linear-to-b from-muted/20 via-background to-muted/20" />

      <div className="container mx-auto px-4 mb-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover courses across diverse topics and unlock your potential
          </p>
        </motion.div>
      </div>

      {/* Multi-row marquee */}
      <div className="relative space-y-6">
        {/* Row 1 - Subcategories (scroll left) */}
        <MarqueeRow items={row1} direction="left" speed={40} isSubcategory />

        {/* Row 2 - Subcategories (scroll right) */}
        <MarqueeRow items={row2} direction="right" speed={35} isSubcategory />

        {/* Row 3 - Main Categories (CENTER - scroll left, slower) */}
        <MarqueeRow
          items={mainCategories}
          direction="left"
          speed={45}
          isMainCategory
        />

        {/* Row 4 - Subcategories (scroll right) */}
        <MarqueeRow items={row4} direction="right" speed={38} isSubcategory />

        {/* Row 5 - Subcategories (scroll left) */}
        <MarqueeRow items={row5} direction="left" speed={42} isSubcategory />
      </div>
    </section>
  );
}

// Marquee Row Component
function MarqueeRow({
  items,
  direction,
  speed,
  isMainCategory = false,
  isSubcategory = false,
}: {
  items: any[];
  direction: "left" | "right";
  speed: number;
  isMainCategory?: boolean;
  isSubcategory?: boolean;
}) {
  // If empty, render nothing
  if (!items || items.length === 0) return null;

  // Duplicate items twice for a seamless 50% loop
  const duplicatedItems = [...items, ...items];

  // Framer Motion controls to allow pause on hover
  const controls = useAnimation();

  // start animation
  const startAnim = () => {
    // animate x from 0 -> -50% for left, or -50% -> 0 for right
    const keyframes = direction === "left" ? ["0%", "-50%"] : ["-50%", "0%"];
    controls.start({
      x: keyframes,
      transition: {
        repeat: Infinity,
        ease: "linear",
        duration: speed,
        repeatType: "loop",
      },
    });
  };

  useEffect(() => {
    startAnim();
    // restart when direction or speed changes
  }, [direction, speed]);

  return (
    <div className="relative overflow-hidden">
      <motion.div
        className="flex gap-4 marquee-inner"
        // initial matches start of animation
        initial={{ x: direction === "left" ? "0%" : "-50%" }}
        animate={controls}
        onMouseEnter={() => controls.stop()}
        onMouseLeave={() => startAnim()}
        style={{
          willChange: "transform",
        }}
      >
        {duplicatedItems.map((item, index) => {
          if (isMainCategory) {
            const Icon = item.icon;
            return (
              <Link
                key={`${item.value}-${index}`}
                href={`/course?category=${item.value}`}
                className="group relative shrink-0"
              >
                <div className="relative bg-card border-2 border-border rounded-2xl px-8 py-6 hover:border-primary hover:shadow-2xl transition-all duration-500 min-w-70">
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-primary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-500">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                        {item.label}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {item.children?.length || 0} subcategories
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          }

          if (isSubcategory) {
            const ParentIcon = item.parentIcon;
            return (
              <Link
                key={`${item.value}-${index}`}
                href={`/course?category=${item.parentValue}&sub_category=${item.value}`}
                className="group relative shrink-0"
              >
                <div className="relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl px-6 py-4 hover:bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 min-w-55">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-300">
                      <ParentIcon className="w-5 h-5 text-primary/70" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                        {item.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.parentLabel}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          }

          return null;
        })}
      </motion.div>
    </div>
  );
}
