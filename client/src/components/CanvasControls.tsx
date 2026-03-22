import { useState, useEffect, useRef, ReactNode, ReactElement, MouseEvent } from "react";

interface CanvasControlsProps {
  children: ReactNode;
}

const CanvasControls = ({ children }: CanvasControlsProps): ReactElement => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | Event): void => {
      if (
        containerRef.current &&
        e.target instanceof Node &&
        !containerRef.current.contains(e.target)
      ) {
        setIsVisible(false);
      }
    };

    document.addEventListener("click", handleClickOutside as EventListener);
    return () => document.removeEventListener("click", handleClickOutside as EventListener);
  }, []);

  const handleToggle = (e: MouseEvent<HTMLAnchorElement>): void => {
    e.stopPropagation();
    setIsVisible(!isVisible);
  };

  return (
    <div
      ref={containerRef}
      id="canvas-controls-container"
      className="absolute top-[15px] left-[20px] font-bold text-[13.5px]"
    >
      <h4 className="text-[1.61em] cursor-default">
        <a onClick={handleToggle} className="cursor-pointer">
          {isVisible ? "hide" : "show"}
        </a>
        {" controls"}
      </h4>

      {isVisible && (
        <div
          id="canvas-controls"
          className="max-w-[501px] bg-black/70 text-white text-[13px] font-bold p-[20px_9px_0] rounded mt-[10px]"
          style={{
            boxShadow: "3px 3px 6px rgb(50, 50, 90), -3px -3px 6px rgb(90, 180, 140)",
          }}
        >
          <div className="grid grid-cols-3 gap-2">{children}</div>
        </div>
      )}
    </div>
  );
};

export default CanvasControls;
