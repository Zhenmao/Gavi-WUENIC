function visEnterObserver({ target, callback }) {
  let observer = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback();
          observer.unobserve(entry.target);
          observer.disconnect();
          observer = null;
          target = null;
          callback = null;
        }
      });
    },
    { rootMargin: "0px 0px -200px 0px" }
  );
  observer.observe(target);
}
