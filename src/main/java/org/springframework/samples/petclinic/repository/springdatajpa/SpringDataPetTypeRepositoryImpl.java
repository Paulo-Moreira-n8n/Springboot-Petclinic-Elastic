package org.springframework.samples.petclinic.repository.springdatajpa;

import java.util.List;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import org.springframework.context.annotation.Profile;
import org.springframework.samples.petclinic.model.PetType;
import org.springframework.transaction.annotation.Transactional;

@Profile("spring-data-jpa")
public class SpringDataPetTypeRepositoryImpl implements PetTypeRepositoryOverride {

    @PersistenceContext
    private EntityManager em;

    @Transactional
    @Override
    public void delete(PetType petType) {
        Integer typeId = petType.getId();

        // 1) Descobrir IDs dos pets desse tipo
        List<Integer> petIds = em.createQuery(
                "SELECT p.id FROM Pet p WHERE p.type.id = :typeId", Integer.class)
            .setParameter("typeId", typeId)
            .getResultList();

        if (!petIds.isEmpty()) {
            // 2) Apagar visitas desses pets
            em.createQuery("DELETE FROM Visit v WHERE v.pet.id IN :petIds")
              .setParameter("petIds", petIds)
              .executeUpdate();

            // 3) Apagar os pets
            em.createQuery("DELETE FROM Pet p WHERE p.id IN :petIds")
              .setParameter("petIds", petIds)
              .executeUpdate();
        }

        // 4) Finalmente, apagar o tipo
        em.createQuery("DELETE FROM PetType pt WHERE pt.id = :typeId")
          .setParameter("typeId", typeId)
          .executeUpdate();

        // 5) Sincroniza e limpa o contexto
        em.flush();
        em.clear();
    }
}
