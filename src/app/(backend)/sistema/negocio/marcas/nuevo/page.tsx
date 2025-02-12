import React from "react";
import FormBusinessHeader from "../../_components/FormBusinessHeader";
import ItemGroupForm from "../../articulos/_components/ItemGroupForm";

export default function NewGroup() {
  return (
    <div>
      <FormBusinessHeader title={"Grupo"} />
      <ItemGroupForm />
    </div>
  );
}
