import { useEffect, useRef } from 'react';

/** Previews a local image File through a temporary blob: URL that is revoked on cleanup. */
const LocalImagePreview = ({ file }) => {
  const imageRef = useRef(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    imageRef.current.src = objectUrl;
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return <img ref={imageRef} alt="" className="size-full object-cover" />;
};

export default LocalImagePreview;
