document.addEventListener("DOMContentLoaded", () => {

    const filterButtons =
        document.querySelectorAll(".filter");

    const cards =
        document.querySelectorAll(".catalog-card");


    filterButtons.forEach(button => {

        button.addEventListener("click", () => {

            

            filterButtons.forEach(btn => {
                btn.classList.remove("active");
            });

            button.classList.add("active");


            

            const filter =
                button.dataset.filter;


           

            cards.forEach(card => {

                const category =
                    card.dataset.category;


                if (
                    filter === "all" ||
                    category === filter
                ) {

                    card.style.display = "block";

                    setTimeout(() => {
                        card.classList.add("show");
                    }, 10);

                } else {

                    card.classList.remove("show");

                    card.style.display = "none";

                }

            });

        });

    });

});