console.log("aaa");

document.querySelectorAll(".mylist-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const workId = btn.id;
      
      async function addMylist() {
        try{
          const res = await axios(`/home/${workId}`, {
            method: "POST"
          })
          btn.innerText = "登録済み";
          btn.ariaDisabled = true;
        } catch {
          alert("マイリストに追加できませんでした。");
        }
      }
      addMylist();
    });
  });